package vn.beestore.api.inquiry.service;

import java.time.Clock;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.ratelimit.RateLimitPolicy;
import vn.beestore.api.common.ratelimit.RateLimiter;
import vn.beestore.api.common.web.ClientInfo;
import vn.beestore.api.inquiry.domain.Inquiry;
import vn.beestore.api.inquiry.domain.Inquiry.ProductSnapshot;
import vn.beestore.api.inquiry.domain.InquiryEvent;
import vn.beestore.api.inquiry.domain.InquiryType;
import vn.beestore.api.inquiry.dto.InquiryDtos.ContactRequest;
import vn.beestore.api.inquiry.dto.InquiryDtos.MyInquiryDto;
import vn.beestore.api.inquiry.dto.InquiryDtos.ProductInquiryRequest;
import vn.beestore.api.inquiry.dto.InquiryDtos.StatusChangeDto;
import vn.beestore.api.inquiry.repository.InquiryEventRepository;
import vn.beestore.api.inquiry.repository.InquiryRepository;
import vn.beestore.api.mail.MailRequestedEvent;
import vn.beestore.api.user.domain.ContactChannel;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.repository.UserRepository;

/** Quote requests and contact messages (ENG-01..05, README §6.6). */
@Service
public class InquiryService {

    static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final InquiryRepository inquiries;
    private final InquiryEventRepository events;
    private final ProductRepository products;
    private final UserRepository users;
    private final CaptchaVerifier captcha;
    private final RateLimiter rateLimiter;
    private final ApplicationEventPublisher publisher;
    private final AppProperties props;
    private final Clock clock;

    public InquiryService(
            InquiryRepository inquiries,
            InquiryEventRepository events,
            ProductRepository products,
            UserRepository users,
            CaptchaVerifier captcha,
            RateLimiter rateLimiter,
            ApplicationEventPublisher publisher,
            AppProperties props,
            Clock clock) {
        this.inquiries = inquiries;
        this.events = events;
        this.products = products;
        this.users = users;
        this.captcha = captcha;
        this.rateLimiter = rateLimiter;
        this.publisher = publisher;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public Inquiry createProductInquiry(ProductInquiryRequest req, UUID userId, ClientInfo client) {
        rateLimiter.check(RateLimitPolicy.INQUIRY_IP, client.ip());
        User user = activeUser(userId);
        if (user == null) {
            captcha.verify(req.captchaToken(), client.ip());
        }
        Product product = products.findById(req.productId())
                .filter(p -> p.getStatus() == ProductStatus.PUBLISHED)
                .orElseThrow(() -> ApiException.notFound("Product"));

        Inquiry inquiry =
                base(InquiryType.PRODUCT, user, req.fullName(), req.email(), req.phone(), req.locale(), client);
        if (inquiry.getPhone() == null) {
            throw ApiException.validation("phone", "must not be blank");
        }
        String locale = inquiry.getLocale();
        String name = product.translation(locale)
                .or(() -> product.translation(CatalogMapper.DEFAULT_LOCALE))
                .map(t -> t.getName())
                .orElse(product.getSlug());
        inquiry.setProduct(product);
        inquiry.setProductSnapshot(new ProductSnapshot(name, product.getPrice(), product.getSlug()));
        inquiry.setQuantity(req.quantity());
        inquiry.setMessage(req.message());
        inquiry.setPreferredContact(preferred(req.preferredContact(), user));
        return save(inquiry);
    }

    @Transactional
    public Inquiry createContact(ContactRequest req, UUID userId, ClientInfo client) {
        rateLimiter.check(RateLimitPolicy.INQUIRY_IP, client.ip());
        User user = activeUser(userId);
        if (user == null) {
            captcha.verify(req.captchaToken(), client.ip());
        }
        Inquiry inquiry =
                base(InquiryType.GENERAL, user, req.fullName(), req.email(), req.phone(), req.locale(), client);
        inquiry.setSubject(req.subject());
        inquiry.setMessage(req.message());
        inquiry.setPreferredContact(preferred(req.preferredContact(), user));
        return save(inquiry);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<MyInquiryDto> myInquiries(UUID userId, int page, int size) {
        Page<Inquiry> result = inquiries.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48)));
        List<UUID> ids = result.getContent().stream().map(Inquiry::getId).toList();
        Map<UUID, List<StatusChangeDto>> history = ids.isEmpty()
                ? Map.of()
                : events.findByInquiryIdInOrderByCreatedAtAsc(ids).stream()
                        .filter(e -> e.getToStatus() != null)
                        .collect(Collectors.groupingBy(
                                e -> e.getInquiry().getId(),
                                Collectors.mapping(
                                        e -> new StatusChangeDto(e.getFromStatus(), e.getToStatus(), e.getCreatedAt()),
                                        Collectors.toList())));
        return PaginatedResponse.of(
                result,
                i -> new MyInquiryDto(
                        i.getCode(),
                        i.getType(),
                        i.getStatus(),
                        i.getProductSnapshot(),
                        i.getQuantity(),
                        i.getSubject(),
                        i.getMessage(),
                        i.getPreferredContact(),
                        i.getCreatedAt(),
                        history.getOrDefault(i.getId(), List.of())));
    }

    /** Guests must provide name, email and phone (ENG-02); users' contact data is copied from their profile. */
    private Inquiry base(
            InquiryType type,
            User user,
            String fullName,
            String email,
            String phone,
            String locale,
            ClientInfo client) {
        Inquiry inquiry = new Inquiry();
        inquiry.setType(type);
        if (user != null) {
            inquiry.setUser(user);
            inquiry.setFullName(user.getFullName());
            inquiry.setEmail(user.getEmail());
            inquiry.setPhone(phone != null ? phone : user.getPhone());
            inquiry.setLocale(locale != null ? locale : user.getPreferredLocale());
        } else {
            require(fullName, "fullName");
            require(email, "email");
            require(phone, "phone");
            inquiry.setFullName(fullName.trim());
            inquiry.setEmail(email.toLowerCase());
            inquiry.setPhone(phone);
            inquiry.setLocale(locale != null ? locale : CatalogMapper.DEFAULT_LOCALE);
        }
        inquiry.setIpAddress(client.ip());
        return inquiry;
    }

    private Inquiry save(Inquiry inquiry) {
        int year = clock.instant().atZone(SHOP_ZONE).getYear();
        inquiry.setCode("INQ-%d-%06d".formatted(year, inquiries.nextCodeNumber()));
        inquiries.save(inquiry);
        events.save(new InquiryEvent(inquiry, inquiry.getUser(), null, inquiry.getStatus(), null));
        notify(inquiry);
        return inquiry;
    }

    /** Confirmation to the customer and notification to sales, sent after commit (ENG-03). */
    private void notify(Inquiry inquiry) {
        Map<String, Object> model = new HashMap<>();
        model.put("name", inquiry.getFullName());
        model.put("code", inquiry.getCode());
        model.put("type", inquiry.getType().name());
        model.put("fullName", inquiry.getFullName());
        model.put("email", inquiry.getEmail());
        model.put("phone", inquiry.getPhone() == null ? "" : inquiry.getPhone());
        model.put(
                "preferredContact",
                inquiry.getPreferredContact() == null
                        ? ""
                        : inquiry.getPreferredContact().name());
        model.put("subject", inquiry.getSubject());
        model.put("message", inquiry.getMessage() == null ? "" : inquiry.getMessage());
        model.put("quantity", inquiry.getQuantity());
        if (inquiry.getProductSnapshot() != null) {
            model.put("productName", inquiry.getProductSnapshot().name());
        }
        publisher.publishEvent(new MailRequestedEvent(
                "inquiry-confirmation", inquiry.getEmail(), inquiry.getLocale(), Map.copyOf(withoutNulls(model))));
        String sales = props.mail().salesNotifyEmail();
        if (sales != null && !sales.isBlank()) {
            publisher.publishEvent(
                    new MailRequestedEvent("inquiry-sales", sales, "vi", Map.copyOf(withoutNulls(model))));
        }
        publisher.publishEvent(
                new InquiryCreatedEvent(inquiry.getCode(), SalesWebhookNotifier.summary(inquiry, props.siteUrl())));
    }

    private User activeUser(UUID userId) {
        if (userId == null) {
            return null;
        }
        return users.findById(userId)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .orElse(null);
    }

    private static ContactChannel preferred(ContactChannel requested, User user) {
        if (requested != null) {
            return requested;
        }
        return user == null ? null : user.getPreferredContact();
    }

    private static void require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw ApiException.validation(field, "must not be blank");
        }
    }

    private static Map<String, Object> withoutNulls(Map<String, Object> map) {
        Map<String, Object> copy = new HashMap<>();
        map.forEach((k, v) -> {
            if (v != null) {
                copy.put(k, v);
            }
        });
        return copy;
    }
}
