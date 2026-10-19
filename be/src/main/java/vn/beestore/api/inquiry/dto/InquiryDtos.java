package vn.beestore.api.inquiry.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import vn.beestore.api.auth.dto.AuthDtos;
import vn.beestore.api.inquiry.domain.Inquiry.ProductSnapshot;
import vn.beestore.api.inquiry.domain.InquiryStatus;
import vn.beestore.api.inquiry.domain.InquiryType;
import vn.beestore.api.user.domain.ContactChannel;

/** Bodies of {@code POST /inquiries}, {@code POST /contact} and {@code GET /me/inquiries} (ENG-01..05). */
public final class InquiryDtos {

    private InquiryDtos() {}

    /**
     * Quote request. Guests must send name, email, phone and a captcha token; logged-in users get name / email (and
     * phone, if missing) from their profile.
     */
    public record ProductInquiryRequest(
            @NotNull UUID productId,
            @Min(1) @Max(100_000) int quantity,
            @Size(max = 2000) String message,
            ContactChannel preferredContact,
            @Pattern(regexp = AuthDtos.PHONE_PATTERN, message = "must be in E.164 format, e.g. +84901234567")
                    String phone,
            @Size(max = 100) String fullName,
            @Email @Size(max = 254) String email,
            String captchaToken,
            @Pattern(regexp = AuthDtos.LOCALE_PATTERN) String locale) {

        public ProductInquiryRequest {
            email = AuthDtos.trim(email);
        }
    }

    /** General contact form {@code /contact} (ENG-04). */
    public record ContactRequest(
            @Size(max = 100) String fullName,
            @Email @Size(max = 254) String email,
            @Pattern(regexp = AuthDtos.PHONE_PATTERN, message = "must be in E.164 format, e.g. +84901234567")
                    String phone,
            ContactChannel preferredContact,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Size(max = 2000) String message,
            String captchaToken,
            @Pattern(regexp = AuthDtos.LOCALE_PATTERN) String locale) {

        public ContactRequest {
            email = AuthDtos.trim(email);
        }
    }

    public record InquiryCreatedResponse(String inquiryCode) {}

    /** Status change visible to the customer; internal staff notes are never exposed here. */
    public record StatusChangeDto(InquiryStatus fromStatus, InquiryStatus toStatus, Instant at) {}

    public record MyInquiryDto(
            String code,
            InquiryType type,
            InquiryStatus status,
            ProductSnapshot product,
            int quantity,
            String subject,
            String message,
            ContactChannel preferredContact,
            Instant createdAt,
            List<StatusChangeDto> history) {}
}
