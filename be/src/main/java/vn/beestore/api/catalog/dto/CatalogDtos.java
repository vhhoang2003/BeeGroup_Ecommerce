package vn.beestore.api.catalog.dto;

import java.util.List;
import vn.beestore.api.catalog.domain.StockStatus;

/**
 * Public catalog DTOs. They mirror {@code fe/src/types/product.ts} and {@code category.ts} exactly (README §8.4,
 * Decision Log D-1); changing a field is an API contract change.
 */
public final class CatalogDtos {

    private CatalogDtos() {}

    public record SubCategoryDto(String slug, String name, long itemCount) {}

    public record CategoryDto(
            String id, String slug, String name, String image, long itemCount, List<SubCategoryDto> subCategories) {}

    public record NamedRef(String slug, String name) {}

    public record ImageDto(String url, String alt) {}

    public record SpecRowDto(String key, String label, String value) {}

    public record ProductSummaryDto(
            String id,
            String slug,
            String name,
            String brand,
            NamedRef category,
            NamedRef subCategory,
            Long price,
            StockStatus stockStatus,
            boolean featured,
            String shortDescription,
            ImageDto image) {}

    public record ProductDetailDto(
            String id,
            String slug,
            String name,
            String brand,
            NamedRef category,
            NamedRef subCategory,
            Long price,
            StockStatus stockStatus,
            boolean featured,
            String shortDescription,
            ImageDto image,
            String description,
            List<String> highlights,
            List<String> useCases,
            List<String> notes,
            List<SpecRowDto> specs,
            List<ImageDto> images,
            List<String> sources,
            String imageCredits) {}
}
