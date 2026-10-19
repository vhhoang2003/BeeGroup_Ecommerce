package vn.beestore.api.admin.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.admin.dto.AdminDtos.AdminInquiryDto;
import vn.beestore.api.admin.dto.AdminDtos.InquiryEventDto;
import vn.beestore.api.admin.dto.AdminDtos.InquiryUpdateRequest;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.inquiry.domain.Inquiry;
import vn.beestore.api.inquiry.domain.InquiryEvent;
import vn.beestore.api.inquiry.domain.InquiryStatus;
import vn.beestore.api.inquiry.repository.InquiryEventRepository;
import vn.beestore.api.inquiry.repository.InquiryRepository;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.repository.UserRepository;

/** Inquiry pipeline for staff: filter, change status, assign, internal notes (ADM-05, ENG-05 history). */
@Service
public class AdminInquiryService {

    private static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final InquiryRepository inquiries;
    private final InquiryEventRepository events;
    private final UserRepository users;
    private final AuditService audit;

    public AdminInquiryService(
            InquiryRepository inquiries, InquiryEventRepository events, UserRepository users, AuditService audit) {
        this.inquiries = inquiries;
        this.events = events;
        this.users = users;
        this.audit = audit;
    }

    public record Filter(
            InquiryStatus status, LocalDate from, LocalDate to, UUID productId, UUID assigneeId, String q) {}

    @Transactional(readOnly = true)
    public PaginatedResponse<AdminInquiryDto> search(Filter f, int page, int size) {
        Specification<Inquiry> spec = (root, cq, cb) -> cb.conjunction();
        if (f.status() != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("status"), f.status()));
        }
        if (f.from() != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(
                    root.get("createdAt"), f.from().atStartOfDay(SHOP_ZONE).toInstant()));
        }
        if (f.to() != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThan(
                    root.get("createdAt"),
                    f.to().plusDays(1).atStartOfDay(SHOP_ZONE).toInstant()));
        }
        if (f.productId() != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("product").get("id"), f.productId()));
        }
        if (f.assigneeId() != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("assignee").get("id"), f.assigneeId()));
        }
        if (f.q() != null && !f.q().isBlank()) {
            String like = "%" + f.q().trim().toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("code")), like),
                    cb.like(cb.lower(root.get("email")), like),
                    cb.like(cb.lower(root.get("fullName")), like),
                    cb.like(cb.lower(root.get("phone")), like)));
        }
        var result = inquiries.findAll(
                spec,
                PageRequest.of(
                        Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Order.desc("createdAt"))));
        return PaginatedResponse.of(result, i -> toDto(i, List.of()));
    }

    @Transactional(readOnly = true)
    public AdminInquiryDto get(UUID id) {
        Inquiry inquiry = find(id);
        return toDto(inquiry, events.findByInquiryIdOrderByCreatedAtAsc(id));
    }

    @Transactional
    public AdminInquiryDto update(UUID id, InquiryUpdateRequest req) {
        Inquiry inquiry = find(id);
        AdminInquiryDto before = toDto(inquiry, List.of());
        User actor = CurrentUser.idIfPresent().flatMap(users::findById).orElse(null);

        if (Boolean.TRUE.equals(req.unassign())) {
            inquiry.setAssignee(null);
        } else if (req.assigneeId() != null) {
            User assignee = users.findById(req.assigneeId())
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .orElseThrow(() -> ApiException.validation("assigneeId", "Assignee must be an admin"));
            inquiry.setAssignee(assignee);
        }

        InquiryStatus from = inquiry.getStatus();
        boolean statusChanged = req.status() != null && req.status() != from;
        if (statusChanged) {
            inquiry.setStatus(req.status());
        }
        String note =
                req.note() == null || req.note().isBlank() ? null : req.note().trim();
        if (statusChanged || note != null) {
            events.save(new InquiryEvent(
                    inquiry, actor, statusChanged ? from : null, statusChanged ? req.status() : null, note));
        }
        inquiries.flush();
        AdminInquiryDto after = toDto(inquiry, events.findByInquiryIdOrderByCreatedAtAsc(id));
        audit.record("INQUIRY_UPDATE", "inquiry", id, before, toDto(inquiry, List.of()));
        return after;
    }

    private Inquiry find(UUID id) {
        return inquiries.findById(id).orElseThrow(() -> ApiException.notFound("Inquiry"));
    }

    private static AdminInquiryDto toDto(Inquiry i, List<InquiryEvent> history) {
        return new AdminInquiryDto(
                i.getId(),
                i.getCode(),
                i.getType(),
                i.getStatus(),
                i.getProduct() == null ? null : i.getProduct().getId(),
                i.getProductSnapshot(),
                i.getQuantity(),
                i.getFullName(),
                i.getEmail(),
                i.getPhone(),
                i.getPreferredContact(),
                i.getSubject(),
                i.getMessage(),
                i.getLocale(),
                i.getUser() == null ? null : i.getUser().getId(),
                i.getAssignee() == null ? null : i.getAssignee().getId(),
                i.getAssignee() == null ? null : i.getAssignee().getFullName(),
                i.getCreatedAt(),
                i.getUpdatedAt(),
                history.stream()
                        .map(e -> new InquiryEventDto(
                                e.getFromStatus(),
                                e.getToStatus(),
                                e.getNote(),
                                e.getActor() == null ? null : e.getActor().getId(),
                                e.getActor() == null ? null : e.getActor().getFullName(),
                                e.getCreatedAt()))
                        .toList());
    }
}
