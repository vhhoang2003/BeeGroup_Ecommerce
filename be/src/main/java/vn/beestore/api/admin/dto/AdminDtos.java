package vn.beestore.api.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.StockStatus;
import vn.beestore.api.inquiry.domain.Inquiry.ProductSnapshot;
import vn.beestore.api.inquiry.domain.InquiryStatus;
import vn.beestore.api.inquiry.domain.InquiryType;
import vn.beestore.api.user.domain.ContactChannel;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.UserStatus;

/** Request / response bodies of {@code /api/v1/admin/**} (ADM-02..08). Localized maps are keyed vi / en / zh. */
public final class AdminDtos {

    private AdminDtos() {}

    public static final String SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

    // --- Products (ADM-02) ---------------------------------------------------------------------------------------

    public record TranslationInput(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 500) String shortDescription,
            String description,
            List<@NotBlank String> highlights,
            List<@NotBlank String> useCases,
            List<@NotBlank String> notes,
            @Size(max = 200) String metaTitle,
            @Size(max = 500) String metaDescription) {}

    public record SpecInput(
            @NotBlank @Size(max = 60) String key,
            @NotEmpty Map<String, String> label,
            @NotEmpty Map<String, String> value) {}

    /** Full product state for create (POST) and replace (PUT). At least the {@code vi} translation is required. */
    public record ProductRequest(
            @NotBlank @Size(max = 120) @Pattern(regexp = SLUG_PATTERN) String slug,
            @Size(max = 50) String sku,
            @NotBlank @Size(max = 60) String brand,
            @NotBlank String categorySlug,
            String subCategorySlug,
            @Min(0) Long price,
            @NotNull StockStatus stockStatus,
            @NotNull ProductStatus status,
            boolean featured,
            @NotEmpty Map<String, @Valid TranslationInput> translations,
            List<@Valid SpecInput> specs,
            List<@NotBlank String> sources) {}

    public record StatusRequest(@NotNull ProductStatus status) {}

    public record AdminImageDto(
            UUID id,
            String url,
            String thumbnailUrl,
            Map<String, String> alt,
            String credit,
            int sortOrder,
            Integer width,
            Integer height) {}

    public record AdminProductDto(
            UUID id,
            String slug,
            String sku,
            String brand,
            String categorySlug,
            String subCategorySlug,
            Long price,
            StockStatus stockStatus,
            ProductStatus status,
            boolean featured,
            Map<String, TranslationInput> translations,
            List<SpecInput> specs,
            List<String> sources,
            List<AdminImageDto> images,
            long viewCount,
            Instant publishedAt,
            Instant createdAt,
            Instant updatedAt) {}

    public record AdminProductListItem(
            UUID id,
            String slug,
            String name,
            String brand,
            String categorySlug,
            Long price,
            StockStatus stockStatus,
            ProductStatus status,
            boolean featured,
            long viewCount,
            Instant updatedAt) {}

    // --- Images (ADM-03) -----------------------------------------------------------------------------------------

    /** Partial update: reorder ({@code sortOrder}), set as primary, edit alt / credit. */
    public record ImageUpdateRequest(
            @Min(0) Integer sortOrder, Boolean primary, Map<String, @Size(max = 200) String> alt, String credit) {}

    // --- Categories (ADM-04) -------------------------------------------------------------------------------------

    public record CategoryRequest(
            @NotBlank @Size(max = 80) @Pattern(regexp = SLUG_PATTERN) String slug,
            @NotEmpty Map<String, @NotBlank @Size(max = 100) String> name,
            @Size(max = 500) String imageUrl,
            @Min(0) int sortOrder) {}

    public record SubCategoryRequest(
            @NotBlank @Size(max = 80) @Pattern(regexp = SLUG_PATTERN) String slug,
            @NotEmpty Map<String, @NotBlank @Size(max = 100) String> name,
            @Min(0) int sortOrder) {}

    public record AdminSubCategoryDto(
            UUID id, String slug, Map<String, String> name, int sortOrder, long productCount) {}

    public record AdminCategoryDto(
            UUID id,
            String slug,
            Map<String, String> name,
            String imageUrl,
            int sortOrder,
            long productCount,
            List<AdminSubCategoryDto> subCategories) {}

    // --- Inquiries (ADM-05) --------------------------------------------------------------------------------------

    /** Any combination: change status, (re)assign to an admin ({@code null} keeps), add an internal note. */
    public record InquiryUpdateRequest(
            InquiryStatus status, UUID assigneeId, Boolean unassign, @Size(max = 2000) String note) {}

    public record InquiryEventDto(
            InquiryStatus fromStatus,
            InquiryStatus toStatus,
            String note,
            UUID actorId,
            String actorName,
            Instant at) {}

    public record AdminInquiryDto(
            UUID id,
            String code,
            InquiryType type,
            InquiryStatus status,
            UUID productId,
            ProductSnapshot product,
            int quantity,
            String fullName,
            String email,
            String phone,
            ContactChannel preferredContact,
            String subject,
            String message,
            String locale,
            UUID userId,
            UUID assigneeId,
            String assigneeName,
            Instant createdAt,
            Instant updatedAt,
            List<InquiryEventDto> events) {}

    // --- Users (ADM-06) ------------------------------------------------------------------------------------------

    /** {@code status} accepts ACTIVE (unlock) or LOCKED (lock). */
    public record UserUpdateRequest(UserStatus status, Role role, Boolean resendVerification) {}

    // --- Audit log (ADM-08) --------------------------------------------------------------------------------------

    public record AuditLogDto(
            UUID id,
            UUID actorId,
            String action,
            String entityType,
            String entityId,
            Object before,
            Object after,
            String ipAddress,
            Instant createdAt) {}
}
