package vn.beestore.api.catalog.importer;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductImage;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.domain.StockStatus;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.importer.SeedModel.CategoryFile;
import vn.beestore.api.catalog.importer.SeedModel.LocaleContent;
import vn.beestore.api.catalog.importer.SeedModel.ProductFile;
import vn.beestore.api.catalog.importer.SeedModel.SubCategoryEntry;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.repository.ProductSearchRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.storage.StorageService;

/**
 * Loads the curated {@code product/} folder into PostgreSQL (AD-5, ADM-07, README §6.8). Idempotent: categories and
 * products are upserted by slug, images are copied to storage only when missing or changed, and products whose data
 * did not change are reported as skipped. Each product is imported in its own transaction so one bad file does not
 * abort the run.
 */
@Service
public class CatalogImporter {

    private static final Logger log = LoggerFactory.getLogger(CatalogImporter.class);
    private static final List<String> CATEGORY_ORDER = List.of("cpu", "gpu", "mainboard", "cooler");

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ProductSearchRepository search;
    private final StorageService storage;
    private final TransactionTemplate tx;
    private final Clock clock;
    private final ObjectMapper json;

    public CatalogImporter(
            CategoryRepository categories,
            ProductRepository products,
            ProductSearchRepository search,
            StorageService storage,
            TransactionTemplate tx,
            Clock clock,
            ObjectMapper objectMapper) {
        this.categories = categories;
        this.products = products;
        this.search = search;
        this.storage = storage;
        this.tx = tx;
        this.clock = clock;
        this.json = objectMapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public ImportReport importFrom(Path root) {
        ImportReport.Builder report = new ImportReport.Builder();
        if (!Files.isDirectory(root)) {
            report.errors.add("Catalog folder not found: " + root);
            return report.build();
        }
        List<Path> categoryDirs;
        try (Stream<Path> dirs = Files.list(root)) {
            categoryDirs = dirs.filter(d -> Files.isRegularFile(d.resolve("category.json")))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            report.errors.add("Cannot list " + root + ": " + e.getMessage());
            return report.build();
        }

        for (Path dir : categoryDirs) {
            CategoryFile file;
            try {
                file = read(dir.resolve("category.json"), CategoryFile.class);
            } catch (IOException e) {
                report.errors.add(dir.getFileName() + "/category.json: " + e.getMessage());
                continue;
            }
            tx.executeWithoutResult(s -> upsertCategory(file, report));
            for (SubCategoryEntry sub : file.subCategories()) {
                for (String folder : sub.products()) {
                    importProduct(dir, folder, file.slug(), sub.slug(), report);
                }
            }
            tx.executeWithoutResult(s -> setCategoryImage(file.slug()));
        }
        ImportReport result = report.build();
        log.info(
                "Catalog import: categories +{} ~{}, products +{} ~{} ={} skipped, {} error(s)",
                result.categoriesCreated(),
                result.categoriesUpdated(),
                result.productsCreated(),
                result.productsUpdated(),
                result.productsSkipped(),
                result.errors().size());
        return result;
    }

    private void upsertCategory(CategoryFile file, ImportReport.Builder report) {
        Category category = categories.findBySlug(file.slug()).orElse(null);
        boolean created = category == null;
        if (created) {
            category = new Category();
            category.setSlug(file.slug());
        }
        // category.json has one name; it is used for every locale until an admin edits it (Decision Log D-4).
        Map<String, String> name = new LinkedHashMap<>();
        CatalogMapper.LOCALES.forEach(l -> name.put(l, file.name()));
        boolean changed = created || !name.equals(category.getName());
        category.setName(name);
        int order = CATEGORY_ORDER.indexOf(file.slug());
        int sortOrder = order >= 0 ? order : CATEGORY_ORDER.size();
        changed |= category.getSortOrder() != sortOrder;
        category.setSortOrder(sortOrder);

        for (int i = 0; i < file.subCategories().size(); i++) {
            SubCategoryEntry entry = file.subCategories().get(i);
            Category owner = category;
            SubCategory sub = category.getSubCategories().stream()
                    .filter(s -> s.getSlug().equals(entry.slug()))
                    .findFirst()
                    .orElseGet(() -> {
                        SubCategory s = new SubCategory();
                        s.setCategory(owner);
                        s.setSlug(entry.slug());
                        owner.getSubCategories().add(s);
                        return s;
                    });
            Map<String, String> subName = new LinkedHashMap<>();
            CatalogMapper.LOCALES.forEach(l -> subName.put(l, entry.name()));
            changed |= !subName.equals(sub.getName()) || sub.getSortOrder() != i;
            sub.setName(subName);
            sub.setSortOrder(i);
        }
        categories.save(category);
        if (created) {
            report.categoriesCreated++;
        } else if (changed) {
            report.categoriesUpdated++;
        }
    }

    private void importProduct(
            Path categoryDir, String folder, String categorySlug, String subSlug, ImportReport.Builder report) {
        Path productDir = categoryDir.resolve(folder);
        Path jsonFile = productDir.resolve("info").resolve("product.json");
        String label = categoryDir.getFileName() + "/" + folder;
        if (!Files.isRegularFile(jsonFile)) {
            report.errors.add(label + ": info/product.json not found");
            return;
        }
        try {
            ProductFile file = read(jsonFile, ProductFile.class);
            Outcome outcome = tx.execute(s -> upsertProduct(file, productDir, categorySlug, subSlug));
            switch (Objects.requireNonNull(outcome)) {
                case CREATED -> report.productsCreated++;
                case UPDATED -> report.productsUpdated++;
                case SKIPPED -> report.productsSkipped++;
            }
        } catch (Exception e) {
            log.warn("Import of {} failed: {}", label, e.toString());
            report.errors.add(label + ": " + e.getMessage());
        }
    }

    private enum Outcome {
        CREATED,
        UPDATED,
        SKIPPED
    }

    private Outcome upsertProduct(ProductFile file, Path productDir, String categorySlug, String subSlug) {
        if (file.slug() == null || file.slug().isBlank()) {
            throw new IllegalArgumentException("missing slug");
        }
        Category category = categories.findBySlug(categorySlug).orElseThrow();
        SubCategory sub = category.getSubCategories().stream()
                .filter(s -> s.getSlug().equals(subSlug))
                .findFirst()
                .orElse(null);

        Product product = products.findBySlug(file.slug()).orElse(null);
        boolean created = product == null;
        String before = created ? null : fingerprint(product);
        if (created) {
            product = new Product();
            product.setSlug(file.slug());
        }

        product.setLegacyId(file.id());
        if (file.sku() != null && !file.sku().isBlank()) {
            product.setSku(file.sku());
        }
        product.setBrand(file.brand());
        product.setCategory(category);
        product.setSubCategory(sub);
        product.setPrice(file.price());
        // Defaults for fields the seed data does not carry (Decision Log D-4).
        product.setStockStatus(
                file.stockStatus() == null ? StockStatus.IN_STOCK : StockStatus.valueOf(file.stockStatus()));
        ProductStatus status = file.status() == null ? ProductStatus.PUBLISHED : ProductStatus.valueOf(file.status());
        product.setStatus(status);
        if (status == ProductStatus.PUBLISHED && product.getPublishedAt() == null) {
            product.setPublishedAt(clock.instant());
        }
        product.setFeatured(Boolean.TRUE.equals(file.featured()));
        product.setSpecs(
                file.specsDetailed() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(file.specsDetailed().stream()
                                .map(s -> new SpecRow(s.key(), s.label(), s.value()))
                                .toList()));
        product.setSources(file.sources() == null ? new ArrayList<>() : new ArrayList<>(file.sources()));
        applyTranslations(product, file);

        if (created) {
            product = products.saveAndFlush(product);
            // Translations are keyed by product id, which only exists now.
            applyTranslations(product, file);
        }
        applyImages(product, file, productDir, categorySlug);
        products.saveAndFlush(product);

        String after = fingerprint(product);
        search.reindex(product.getId());
        if (created) {
            return Outcome.CREATED;
        }
        return after.equals(before) ? Outcome.SKIPPED : Outcome.UPDATED;
    }

    private static void applyTranslations(Product product, ProductFile file) {
        if (product.getId() == null || file.i18n() == null) {
            return;
        }
        for (String locale : CatalogMapper.LOCALES) {
            LocaleContent content = file.i18n().get(locale);
            if (content == null || content.name() == null) {
                continue;
            }
            ProductTranslation t = product.translationFor(locale);
            t.setName(content.name());
            t.setShortDescription(truncate(content.shortDescription(), 500));
            t.setDescription(content.description());
            t.setHighlights(listOrEmpty(content.highlights()));
            t.setUseCases(listOrEmpty(content.useCases()));
            t.setNotes(listOrEmpty(content.notes()));
        }
    }

    private void applyImages(Product product, ProductFile file, Path productDir, String categorySlug) {
        List<String> declared = file.images() != null && !file.images().isEmpty()
                ? file.images()
                : file.image() != null ? List.of(file.image()) : List.of();
        String credit = readCredits(productDir);

        List<String> keys = new ArrayList<>();
        Map<String, int[]> sizes = new HashMap<>();
        for (String relative : declared) {
            Path source = productDir.resolve(relative).normalize();
            if (!source.startsWith(productDir) || !Files.isRegularFile(source)) {
                continue;
            }
            String key = "catalog/" + categorySlug + "/" + product.getSlug() + "/" + source.getFileName();
            try {
                long fileSize = Files.size(source);
                if (!storage.exists(key) || storage.size(key) != fileSize) {
                    storage.put(key, Files.readAllBytes(source), Files.probeContentType(source));
                }
                sizes.put(key, dimensions(source));
            } catch (IOException e) {
                throw new java.io.UncheckedIOException(e);
            }
            keys.add(key);
        }

        List<String> current =
                product.getImages().stream().map(ProductImage::getStorageKey).toList();
        if (current.equals(keys)) {
            product.getImages().forEach(img -> img.setCredit(credit));
            return;
        }
        product.getImages().clear();
        for (int i = 0; i < keys.size(); i++) {
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setStorageKey(keys.get(i));
            img.setSortOrder(i);
            img.setCredit(credit);
            int[] wh = sizes.get(keys.get(i));
            if (wh != null) {
                img.setWidth(wh[0]);
                img.setHeight(wh[1]);
            }
            product.getImages().add(img);
        }
    }

    /** Uses the first product (in category order) that has a photo as the category tile image. */
    private void setCategoryImage(String categorySlug) {
        Category category = categories.findBySlug(categorySlug).orElseThrow();
        products.findAll((root, q, cb) -> cb.equal(root.get("category").get("id"), category.getId())).stream()
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .flatMap(p -> p.getImages().stream().limit(1))
                .findFirst()
                .ifPresent(img -> category.setImageUrl(img.getStorageKey()));
    }

    /** Stable text form of everything the importer writes, to tell "updated" from "skipped". */
    private String fingerprint(Product p) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("legacyId", p.getLegacyId());
        f.put("brand", p.getBrand());
        f.put("category", p.getCategory() == null ? null : p.getCategory().getSlug());
        f.put("sub", p.getSubCategory() == null ? null : p.getSubCategory().getSlug());
        f.put("price", p.getPrice());
        f.put("stock", p.getStockStatus());
        f.put("status", p.getStatus());
        f.put("featured", p.isFeatured());
        f.put("specs", p.getSpecs());
        f.put("sources", p.getSources());
        p.getTranslations().stream()
                .sorted(Comparator.comparing(ProductTranslation::getLocale))
                .forEach(t -> f.put(
                        "t." + t.getLocale(),
                        List.of(
                                String.valueOf(t.getName()),
                                String.valueOf(t.getShortDescription()),
                                String.valueOf(t.getDescription()),
                                t.getHighlights(),
                                t.getUseCases(),
                                t.getNotes())));
        p.getImages().forEach(img -> f.put("img." + img.getSortOrder(), img.getStorageKey() + "|" + img.getCredit()));
        try {
            return json.writeValueAsString(f);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private <T> T read(Path file, Class<T> type) throws IOException {
        String text = Files.readString(file, StandardCharsets.UTF_8);
        if (text.startsWith("﻿")) {
            text = text.substring(1);
        }
        return json.readValue(text, type);
    }

    private static String readCredits(Path productDir) {
        for (Path candidate : List.of(productDir.resolve("images/CREDITS.txt"), productDir.resolve("CREDITS.txt"))) {
            if (Files.isRegularFile(candidate)) {
                try {
                    String text =
                            Files.readString(candidate, StandardCharsets.UTF_8).strip();
                    return text.isEmpty() ? null : text;
                } catch (IOException e) {
                    return null;
                }
            }
        }
        return null;
    }

    private static int[] dimensions(Path image) {
        try (ImageInputStream in = ImageIO.createImageInputStream(image.toFile())) {
            if (in == null) {
                return null;
            }
            var readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                return null;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(in);
                return new int[] {reader.getWidth(0), reader.getHeight(0)};
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            return null;
        }
    }

    private static List<String> listOrEmpty(List<String> list) {
        return list == null ? new ArrayList<>() : new ArrayList<>(list);
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
