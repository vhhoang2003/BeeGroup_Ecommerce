package vn.beestore.api.catalog.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductImage;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.dto.CatalogDtos.ImageDto;
import vn.beestore.api.catalog.dto.CatalogDtos.NamedRef;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductDetailDto;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductSummaryDto;
import vn.beestore.api.catalog.dto.CatalogDtos.SpecRowDto;
import vn.beestore.api.storage.StorageService;

/** Entity to public DTO mapping with locale fallback to Vietnamese (CAT-06). */
@Component
public class CatalogMapper {

    public static final String DEFAULT_LOCALE = "vi";
    public static final List<String> LOCALES = List.of("vi", "en", "zh");

    /** Width of the WebP variant used for each place an image appears (uploaded images only, ADM-03). */
    static final int SUMMARY_VARIANT = 800;

    static final int DETAIL_VARIANT = 1600;

    private final StorageService storage;

    public CatalogMapper(StorageService storage) {
        this.storage = storage;
    }

    public static String normalizeLocale(String locale) {
        return locale != null && LOCALES.contains(locale) ? locale : DEFAULT_LOCALE;
    }

    public static String pick(Map<String, String> localized, String locale) {
        if (localized == null || localized.isEmpty()) {
            return "";
        }
        String value = localized.get(locale);
        if (isBlank(value)) {
            value = localized.get(DEFAULT_LOCALE);
        }
        if (isBlank(value)) {
            value = localized.get("en");
        }
        if (isBlank(value)) {
            value = localized.values().stream()
                    .filter(v -> !isBlank(v))
                    .findFirst()
                    .orElse("");
        }
        return value;
    }

    public String categoryImageUrl(Category category) {
        String image = category.getImageUrl();
        if (isBlank(image)) {
            return null;
        }
        return image.startsWith("http://") || image.startsWith("https://") ? image : storage.publicUrl(image);
    }

    public NamedRef ref(Category c, String locale) {
        return new NamedRef(c.getSlug(), pick(c.getName(), locale));
    }

    public NamedRef ref(SubCategory s, String locale) {
        return s == null ? null : new NamedRef(s.getSlug(), pick(s.getName(), locale));
    }

    public ProductSummaryDto toSummary(Product p, String locale) {
        ProductTranslation t = translation(p, locale);
        List<ProductImage> images = p.getImages();
        return new ProductSummaryDto(
                p.getId().toString(),
                p.getSlug(),
                t == null ? p.getSlug() : t.getName(),
                p.getBrand(),
                ref(p.getCategory(), locale),
                ref(p.getSubCategory(), locale),
                p.getPrice(),
                p.getStockStatus(),
                p.isFeatured(),
                t == null || t.getShortDescription() == null ? "" : t.getShortDescription(),
                images.isEmpty() ? null : image(images.get(0), 0, nameOf(t, p), locale, SUMMARY_VARIANT));
    }

    public ProductDetailDto toDetail(Product p, String locale) {
        ProductTranslation t = translation(p, locale);
        String name = nameOf(t, p);
        List<ImageDto> images = new java.util.ArrayList<>();
        for (int i = 0; i < p.getImages().size(); i++) {
            images.add(image(p.getImages().get(i), i, name, locale, DETAIL_VARIANT));
        }
        String credits = p.getImages().stream()
                .map(ProductImage::getCredit)
                .filter(Objects::nonNull)
                .filter(c -> !c.isBlank())
                .distinct()
                .collect(Collectors.joining("\n\n"));
        ProductSummaryDto s = toSummary(p, locale);
        return new ProductDetailDto(
                s.id(),
                s.slug(),
                s.name(),
                s.brand(),
                s.category(),
                s.subCategory(),
                s.price(),
                s.stockStatus(),
                s.featured(),
                s.shortDescription(),
                images.isEmpty() ? null : images.get(0),
                t == null || t.getDescription() == null ? "" : t.getDescription(),
                t == null ? List.of() : t.getHighlights(),
                t == null ? List.of() : t.getUseCases(),
                t == null ? List.of() : t.getNotes(),
                p.getSpecs().stream().map(row -> spec(row, locale)).toList(),
                images,
                p.getSources(),
                credits.isEmpty() ? null : credits);
    }

    /** Requested locale, else Vietnamese, else whatever exists. */
    static ProductTranslation translation(Product p, String locale) {
        return p.translation(locale)
                .or(() -> p.translation(DEFAULT_LOCALE))
                .or(() -> p.getTranslations().stream().findFirst())
                .orElse(null);
    }

    private static String nameOf(ProductTranslation t, Product p) {
        return t == null ? p.getSlug() : t.getName();
    }

    private ImageDto image(ProductImage img, int index, String productName, String locale, int variant) {
        String alt = pick(img.getAlt(), locale);
        if (alt.isEmpty()) {
            alt = index == 0 ? productName : productName + " (" + (index + 1) + ")";
        }
        return new ImageDto(storage.publicUrl(objectKey(img.getStorageKey(), variant)), alt);
    }

    /** Imported images keep their file name; uploaded ones store a base key with {@code -<width>.webp} variants. */
    public static String objectKey(String storageKey, int variant) {
        String last = storageKey.substring(storageKey.lastIndexOf('/') + 1);
        return last.contains(".") ? storageKey : storageKey + "-" + variant + ".webp";
    }

    private static SpecRowDto spec(SpecRow row, String locale) {
        return new SpecRowDto(row.key(), pick(row.label(), locale), pick(row.value(), locale));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
