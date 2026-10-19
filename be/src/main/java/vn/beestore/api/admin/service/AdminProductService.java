package vn.beestore.api.admin.service;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.admin.dto.AdminDtos.AdminImageDto;
import vn.beestore.api.admin.dto.AdminDtos.AdminProductDto;
import vn.beestore.api.admin.dto.AdminDtos.AdminProductListItem;
import vn.beestore.api.admin.dto.AdminDtos.ImageUpdateRequest;
import vn.beestore.api.admin.dto.AdminDtos.ProductRequest;
import vn.beestore.api.admin.dto.AdminDtos.SpecInput;
import vn.beestore.api.admin.dto.AdminDtos.TranslationInput;
import vn.beestore.api.admin.service.RevalidationNotifier.ContentChanged;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductImage;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.repository.ProductSearchRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.storage.ImageProcessor;
import vn.beestore.api.storage.ImageProcessor.ProcessedImage;
import vn.beestore.api.storage.StorageService;

/** Product CRUD, publish workflow and image management for admins (ADM-02, ADM-03, README §6.7). */
@Service
public class AdminProductService {

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final ProductSearchRepository search;
    private final StorageService storage;
    private final ImageProcessor images;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public AdminProductService(
            ProductRepository products,
            CategoryRepository categories,
            ProductSearchRepository search,
            StorageService storage,
            ImageProcessor images,
            AuditService audit,
            ApplicationEventPublisher events,
            Clock clock) {
        this.products = products;
        this.categories = categories;
        this.search = search;
        this.storage = storage;
        this.images = images;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AdminProductListItem> list(
            String q, ProductStatus status, String categorySlug, int page, int size) {
        Specification<Product> spec = (root, cq, cb) -> cb.conjunction();
        if (status != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("status"), status));
        }
        if (categorySlug != null && !categorySlug.isBlank()) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("category").get("slug"), categorySlug));
        }
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> {
                var t = root.join("translations", jakarta.persistence.criteria.JoinType.LEFT);
                cq.distinct(true);
                return cb.or(
                        cb.like(cb.lower(root.get("slug")), like),
                        cb.like(cb.lower(root.get("brand")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(t.get("name")), like));
            });
        }
        var result = products.findAll(
                spec,
                PageRequest.of(
                        Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Order.desc("updatedAt"))));
        return PaginatedResponse.of(result, this::toListItem);
    }

    @Transactional(readOnly = true)
    public AdminProductDto get(UUID id) {
        return toDto(find(id));
    }

    @Transactional
    public AdminProductDto create(ProductRequest req) {
        validate(req, null);
        Product product = new Product();
        apply(product, req);
        product = products.saveAndFlush(product);
        applyTranslations(product, req.translations());
        products.flush();
        search.reindex(product.getId());
        AdminProductDto dto = toDto(product);
        audit.record("PRODUCT_CREATE", "product", product.getId(), null, dto);
        revalidate(product, null);
        return dto;
    }

    @Transactional
    public AdminProductDto update(UUID id, ProductRequest req) {
        Product product = find(id);
        AdminProductDto before = toDto(product);
        String oldSlug = product.getSlug();
        validate(req, product);
        apply(product, req);
        applyTranslations(product, req.translations());
        products.flush();
        search.reindex(product.getId());
        AdminProductDto after = toDto(product);
        audit.record("PRODUCT_UPDATE", "product", id, before, after);
        revalidate(product, oldSlug);
        return after;
    }

    @Transactional
    public AdminProductDto changeStatus(UUID id, ProductStatus status) {
        Product product = find(id);
        ProductStatus old = product.getStatus();
        product.setStatus(status);
        if (status == ProductStatus.PUBLISHED && product.getPublishedAt() == null) {
            product.setPublishedAt(clock.instant());
        }
        audit.record("PRODUCT_STATUS", "product", id, Map.of("status", old), Map.of("status", status));
        revalidate(product, null);
        return toDto(product);
    }

    /** Hard delete. Inquiries keep their product snapshot (FK set null); wishlist entries are removed. */
    @Transactional
    public void delete(UUID id) {
        Product product = find(id);
        AdminProductDto before = toDto(product);
        List<String> keys =
                product.getImages().stream().map(ProductImage::getStorageKey).toList();
        products.delete(product);
        products.flush();
        keys.forEach(this::deleteObjects);
        audit.record("PRODUCT_DELETE", "product", id, before, null);
        revalidate(product, null);
    }

    // --- Images (ADM-03) -------------------------------------------------------------------------------------------

    @Transactional
    public AdminImageDto addImage(UUID productId, byte[] bytes, Map<String, String> alt, String credit) {
        Product product = find(productId);
        ProcessedImage processed = images.process(bytes);
        String baseKey = "products/" + productId + "/" + UUID.randomUUID();
        processed.variants().forEach((width, data) -> storage.put(baseKey + "-" + width + ".webp", data, "image/webp"));

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setStorageKey(baseKey);
        image.setAlt(alt == null ? new LinkedHashMap<>() : new LinkedHashMap<>(alt));
        image.setCredit(credit);
        image.setWidth(processed.width());
        image.setHeight(processed.height());
        image.setSortOrder(product.getImages().size());
        product.getImages().add(image);
        // The product is managed: flush cascades the insert and assigns the id to this very instance
        // (save() would merge and copy the new image instead).
        products.flush();

        AdminImageDto dto = toImageDto(image);
        audit.record("PRODUCT_IMAGE_ADD", "product", productId, null, dto);
        revalidate(product, null);
        return dto;
    }

    @Transactional
    public AdminProductDto updateImage(UUID productId, UUID imageId, ImageUpdateRequest req) {
        Product product = find(productId);
        ProductImage image = findImage(product, imageId);
        AdminImageDto before = toImageDto(image);
        List<ProductImage> ordered = new ArrayList<>(product.getImages());
        ordered.sort(Comparator.comparingInt(ProductImage::getSortOrder));

        Integer target = Boolean.TRUE.equals(req.primary()) ? Integer.valueOf(0) : req.sortOrder();
        if (target != null) {
            ordered.remove(image);
            ordered.add(Math.min(target, ordered.size()), image);
        }
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSortOrder(i);
        }
        if (req.alt() != null) {
            image.setAlt(new LinkedHashMap<>(req.alt()));
        }
        if (req.credit() != null) {
            image.setCredit(req.credit().isBlank() ? null : req.credit());
        }
        product.getImages().sort(Comparator.comparingInt(ProductImage::getSortOrder));
        products.flush();
        audit.record("PRODUCT_IMAGE_UPDATE", "product_image", imageId, before, toImageDto(image));
        revalidate(product, null);
        return toDto(product);
    }

    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        Product product = find(productId);
        ProductImage image = findImage(product, imageId);
        AdminImageDto before = toImageDto(image);
        product.getImages().remove(image);
        for (int i = 0; i < product.getImages().size(); i++) {
            product.getImages().get(i).setSortOrder(i);
        }
        products.flush();
        deleteObjects(image.getStorageKey());
        audit.record("PRODUCT_IMAGE_DELETE", "product_image", imageId, before, null);
        revalidate(product, null);
    }

    // --- helpers ---------------------------------------------------------------------------------------------------

    private Product find(UUID id) {
        return products.findById(id).orElseThrow(() -> ApiException.notFound("Product"));
    }

    private static ProductImage findImage(Product product, UUID imageId) {
        return product.getImages().stream()
                .filter(i -> i.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Image"));
    }

    /** Slug / SKU unique, price >= 0 (bean validation), Vietnamese content present (README §6.7). */
    private void validate(ProductRequest req, Product existing) {
        if ((existing == null || !existing.getSlug().equals(req.slug())) && products.existsBySlug(req.slug())) {
            throw new ApiException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already exists");
        }
        String sku = blankToNull(req.sku());
        if (sku != null && (existing == null || !sku.equals(existing.getSku())) && products.existsBySku(sku)) {
            throw ApiException.validation("sku", "SKU already exists");
        }
        if (!req.translations().containsKey(CatalogMapper.DEFAULT_LOCALE)) {
            throw ApiException.validation("translations.vi", "Vietnamese content is required");
        }
        for (String locale : req.translations().keySet()) {
            if (!CatalogMapper.LOCALES.contains(locale)) {
                throw ApiException.validation("translations", "Unsupported locale: " + locale);
            }
        }
    }

    private void apply(Product product, ProductRequest req) {
        Category category = categories
                .findBySlug(req.categorySlug())
                .orElseThrow(() -> ApiException.validation("categorySlug", "Unknown category"));
        SubCategory sub = null;
        if (req.subCategorySlug() != null && !req.subCategorySlug().isBlank()) {
            sub = category.getSubCategories().stream()
                    .filter(s -> s.getSlug().equals(req.subCategorySlug()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.validation("subCategorySlug", "Unknown sub-category"));
        }
        product.setSlug(req.slug());
        product.setSku(blankToNull(req.sku()));
        product.setBrand(req.brand().trim());
        product.setCategory(category);
        product.setSubCategory(sub);
        product.setPrice(req.price());
        product.setStockStatus(req.stockStatus());
        product.setStatus(req.status());
        product.setFeatured(req.featured());
        if (req.status() == ProductStatus.PUBLISHED && product.getPublishedAt() == null) {
            product.setPublishedAt(clock.instant());
        }
        product.setSpecs(
                req.specs() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(req.specs().stream()
                                .map(s -> new SpecRow(s.key(), s.label(), s.value()))
                                .toList()));
        product.setSources(req.sources() == null ? new ArrayList<>() : new ArrayList<>(req.sources()));
    }

    /** Replaces the translations: locales missing from the request are removed. */
    private static void applyTranslations(Product product, Map<String, TranslationInput> input) {
        product.getTranslations().removeIf(t -> !input.containsKey(t.getLocale()));
        input.forEach((locale, in) -> {
            ProductTranslation t = product.translationFor(locale);
            t.setName(in.name().trim());
            t.setShortDescription(in.shortDescription());
            t.setDescription(in.description());
            t.setHighlights(in.highlights() == null ? new ArrayList<>() : new ArrayList<>(in.highlights()));
            t.setUseCases(in.useCases() == null ? new ArrayList<>() : new ArrayList<>(in.useCases()));
            t.setNotes(in.notes() == null ? new ArrayList<>() : new ArrayList<>(in.notes()));
            t.setMetaTitle(in.metaTitle());
            t.setMetaDescription(in.metaDescription());
        });
    }

    private void deleteObjects(String storageKey) {
        if (storageKey.substring(storageKey.lastIndexOf('/') + 1).contains(".")) {
            storage.delete(storageKey);
        } else {
            ImageProcessor.VARIANT_WIDTHS.forEach(w -> storage.delete(storageKey + "-" + w + ".webp"));
        }
    }

    private void revalidate(Product product, String oldSlug) {
        List<String> paths = new ArrayList<>(List.of(
                "/",
                "/products",
                "/products/" + product.getSlug(),
                "/category/" + product.getCategory().getSlug()));
        if (oldSlug != null && !oldSlug.equals(product.getSlug())) {
            paths.add("/products/" + oldSlug);
        }
        events.publishEvent(new ContentChanged(paths));
    }

    private AdminProductListItem toListItem(Product p) {
        String name = p.translation(CatalogMapper.DEFAULT_LOCALE)
                .map(ProductTranslation::getName)
                .orElse(p.getSlug());
        return new AdminProductListItem(
                p.getId(),
                p.getSlug(),
                name,
                p.getBrand(),
                p.getCategory().getSlug(),
                p.getPrice(),
                p.getStockStatus(),
                p.getStatus(),
                p.isFeatured(),
                p.getViewCount(),
                p.getUpdatedAt());
    }

    AdminProductDto toDto(Product p) {
        Map<String, TranslationInput> translations = new LinkedHashMap<>();
        p.getTranslations().stream()
                .sorted(Comparator.comparingInt(t -> CatalogMapper.LOCALES.indexOf(t.getLocale())))
                .forEach(t -> translations.put(
                        t.getLocale(),
                        new TranslationInput(
                                t.getName(),
                                t.getShortDescription(),
                                t.getDescription(),
                                t.getHighlights(),
                                t.getUseCases(),
                                t.getNotes(),
                                t.getMetaTitle(),
                                t.getMetaDescription())));
        return new AdminProductDto(
                p.getId(),
                p.getSlug(),
                p.getSku(),
                p.getBrand(),
                p.getCategory().getSlug(),
                p.getSubCategory() == null ? null : p.getSubCategory().getSlug(),
                p.getPrice(),
                p.getStockStatus(),
                p.getStatus(),
                p.isFeatured(),
                translations,
                p.getSpecs().stream()
                        .map(s -> new SpecInput(s.key(), s.label(), s.value()))
                        .toList(),
                p.getSources(),
                p.getImages().stream()
                        .sorted(Comparator.comparingInt(ProductImage::getSortOrder))
                        .map(this::toImageDto)
                        .toList(),
                p.getViewCount(),
                p.getPublishedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    private AdminImageDto toImageDto(ProductImage img) {
        return new AdminImageDto(
                img.getId(),
                storage.publicUrl(CatalogMapper.objectKey(img.getStorageKey(), 1600)),
                storage.publicUrl(CatalogMapper.objectKey(img.getStorageKey(), 320)),
                img.getAlt(),
                img.getCredit(),
                img.getSortOrder(),
                img.getWidth(),
                img.getHeight());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
