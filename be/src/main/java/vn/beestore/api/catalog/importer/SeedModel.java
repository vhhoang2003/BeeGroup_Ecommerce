package vn.beestore.api.catalog.importer;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/** Shape of the seed files in {@code product/} (README §1.4). Unknown fields are ignored. */
final class SeedModel {

    private SeedModel() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CategoryFile(String name, String slug, List<SubCategoryEntry> subCategories) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SubCategoryEntry(String name, String slug, List<String> products) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ProductFile(
            String id,
            String name,
            String slug,
            String sku,
            String brand,
            Long price,
            String status,
            String stockStatus,
            Boolean featured,
            String image,
            List<String> images,
            List<SpecEntry> specsDetailed,
            Map<String, LocaleContent> i18n,
            List<String> sources) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SpecEntry(String key, Map<String, String> label, Map<String, String> value) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record LocaleContent(
            String name,
            String shortDescription,
            String description,
            List<String> highlights,
            List<String> useCases,
            List<String> notes) {}
}
