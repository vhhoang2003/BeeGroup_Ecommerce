package vn.beestore.api.admin.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.admin.dto.AdminDtos.AdminInquiryDto;
import vn.beestore.api.admin.dto.AdminDtos.InquiryUpdateRequest;
import vn.beestore.api.admin.service.AdminInquiryService;
import vn.beestore.api.admin.service.AdminInquiryService.Filter;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.inquiry.domain.InquiryStatus;

/** {@code /api/v1/admin/inquiries} (ADM-05). */
@RestController
@RequestMapping("/api/v1/admin/inquiries")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInquiryController {

    private final AdminInquiryService inquiries;

    public AdminInquiryController(AdminInquiryService inquiries) {
        this.inquiries = inquiries;
    }

    @GetMapping
    ApiResponse<PaginatedResponse<AdminInquiryDto>> list(
            @RequestParam(required = false) InquiryStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID assignee,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(inquiries.search(new Filter(status, from, to, productId, assignee, q), page, size));
    }

    @GetMapping("/{id}")
    ApiResponse<AdminInquiryDto> get(@PathVariable UUID id) {
        return ApiResponse.ok(inquiries.get(id));
    }

    @PatchMapping("/{id}")
    ApiResponse<AdminInquiryDto> update(@PathVariable UUID id, @Valid @RequestBody InquiryUpdateRequest req) {
        return ApiResponse.ok(inquiries.update(id, req));
    }
}
