package vn.beestore.api.admin.sheet;

import java.util.ArrayList;
import java.util.List;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.service.CatalogMapper;

/**
 * Starter content for products created from the price list: short description, description and highlights in every
 * locale, built from the specs in the sheet. Admins refine it later in the product form; imports never overwrite it.
 */
final class ProductSheetContent {

    private ProductSheetContent() {}

    private static final int SUMMARY_SPECS = 4;
    private static final int HIGHLIGHTS = 5;

    /** {@code product} must already have an id (translations are keyed by it). */
    static void fill(Product product, String name, Category category, Integer warrantyMonths) {
        List<SpecRow> specs = product.getSpecs().stream()
                .filter(s -> !ProductSheetFormat.WARRANTY_KEY.equals(s.key()))
                .toList();
        for (String locale : CatalogMapper.LOCALES) {
            String categoryName = CatalogMapper.pick(category.getName(), locale);
            List<String> pairs = new ArrayList<>();
            for (SpecRow s : specs) {
                pairs.add(CatalogMapper.pick(s.label(), locale) + ": " + CatalogMapper.pick(s.value(), locale));
            }
            String subName = product.getSubCategory() == null
                    ? null
                    : CatalogMapper.pick(product.getSubCategory().getName(), locale);

            ProductTranslation t = product.translationFor(locale);
            t.setName(name);
            t.setShortDescription(truncate(
                    pairs.isEmpty()
                            ? intro(locale, name, product.getBrand(), categoryName, subName)
                            : String.join(" · ", pairs.subList(0, Math.min(SUMMARY_SPECS, pairs.size()))),
                    500));
            t.setDescription(
                    description(locale, name, product.getBrand(), categoryName, subName, pairs, warrantyMonths));
            t.setHighlights(new ArrayList<>(pairs.subList(0, Math.min(HIGHLIGHTS, pairs.size()))));
            t.setUseCases(new ArrayList<>());
            t.setNotes(new ArrayList<>());
        }
    }

    private static String intro(String locale, String name, String brand, String category, String sub) {
        return switch (locale) {
            case "en" ->
                name + " is a " + brand + " product in the " + category + " category"
                        + (sub == null ? "" : " (" + sub + ")") + ".";
            case "zh" -> name + " 是 " + brand + " 的" + category + "产品" + (sub == null ? "" : "（" + sub + "）") + "。";
            default ->
                name + " thuộc danh mục " + category + (sub == null ? "" : ", dòng " + sub) + " của " + brand + ".";
        };
    }

    private static String description(
            String locale,
            String name,
            String brand,
            String category,
            String sub,
            List<String> pairs,
            Integer warrantyMonths) {
        StringBuilder text = new StringBuilder(intro(locale, name, brand, category, sub));
        if (!pairs.isEmpty()) {
            String specs = String.join("; ", pairs);
            text.append(
                    switch (locale) {
                        case "en" -> " Key specs: " + specs + ".";
                        case "zh" -> " 主要规格：" + specs + "。";
                        default -> " Thông số chính: " + specs + ".";
                    });
        }
        if (warrantyMonths != null && warrantyMonths > 0) {
            text.append(
                    switch (locale) {
                        case "en" -> " " + warrantyMonths + "-month warranty.";
                        case "zh" -> " 保修 " + warrantyMonths + " 个月。";
                        default -> " Bảo hành " + warrantyMonths + " tháng.";
                    });
        }
        return text.toString();
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
