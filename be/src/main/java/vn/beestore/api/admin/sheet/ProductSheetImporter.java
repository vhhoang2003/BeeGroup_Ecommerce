package vn.beestore.api.admin.sheet;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import vn.beestore.api.admin.dto.AdminDtos.SheetChange;
import vn.beestore.api.admin.dto.AdminDtos.SheetImportReport;
import vn.beestore.api.admin.dto.AdminDtos.SheetIssue;
import vn.beestore.api.admin.dto.AdminDtos.SheetRowResult;
import vn.beestore.api.admin.service.AuditService;
import vn.beestore.api.admin.service.RevalidationNotifier.ContentChanged;
import vn.beestore.api.admin.sheet.ProductSheetFormat.Field;
import vn.beestore.api.admin.sheet.ProductSheetFormat.SpecColumn;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.domain.StockStatus;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.repository.ProductSearchRepository;
import vn.beestore.api.catalog.repository.SubCategoryRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.error.ApiException;

/**
 * Imports the standard price list workbook ({@link ProductSheetFormat}). Rows are matched to products by code (slug),
 * then SKU, then the slug of their name; matched products get only the cells that differ, new rows become products
 * with generated slug, name, specs and descriptions in every locale (images are added later in the admin).
 *
 * <p>A check run ({@code apply = false}) does the same work in a transaction that is rolled back, so the preview is
 * exactly what an import would do. An import with any error is rolled back as a whole.
 */
@Service
public class ProductSheetImporter {

    private static final int MAX_ROWS = 2000;
    private static final int HEADER_SEARCH_ROWS = 5;
    private static final Pattern PRICE_TEXT = Pattern.compile("^[0-9][0-9 .,]*(d|vnd|vnđ)?$");
    private static final DataFormatter FORMATTER = new DataFormatter();

    private final CategoryRepository categories;
    private final SubCategoryRepository subCategories;
    private final ProductRepository products;
    private final ProductSearchRepository search;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final TransactionTemplate tx;
    private final Clock clock;

    public ProductSheetImporter(
            CategoryRepository categories,
            SubCategoryRepository subCategories,
            ProductRepository products,
            ProductSearchRepository search,
            AuditService audit,
            ApplicationEventPublisher events,
            TransactionTemplate tx,
            Clock clock) {
        this.categories = categories;
        this.subCategories = subCategories;
        this.products = products;
        this.search = search;
        this.audit = audit;
        this.events = events;
        this.tx = tx;
        this.clock = clock;
    }

    public SheetImportReport importSheet(byte[] bytes, boolean apply) {
        List<SheetData> sheets = read(bytes);
        return tx.execute(status -> {
            Run run = new Run();
            for (SheetData sheet : sheets) {
                processSheet(sheet, run);
            }
            if (run.rows.isEmpty() && run.errors.isEmpty()) {
                run.errors.add(new SheetIssue("NO_ROWS", null));
            }
            boolean ok = run.errors.isEmpty() && run.rows.stream().noneMatch(r -> r.action.equals("ERROR"));
            boolean applied = apply && ok;
            if (applied) {
                SheetImportReport report = run.report(true);
                audit.record("PRODUCT_SHEET_IMPORT", "product", null, null, summary(report));
                if (!run.paths.isEmpty()) {
                    run.paths.addAll(List.of("/", "/products"));
                    events.publishEvent(new ContentChanged(List.copyOf(run.paths)));
                }
                return report;
            }
            status.setRollbackOnly();
            return run.report(false);
        });
    }

    // --- Reading the workbook -------------------------------------------------------------------------------------

    /** One category sheet: the column layout and the non-empty data rows. */
    private record SheetData(String name, String categoryKey, List<Column> columns, List<RowData> rows) {}

    /** Exactly one of {@code field}, {@code spec}, {@code customHeader} is set. */
    private record Column(int index, Field field, SpecColumn spec, String customHeader) {}

    private record RowData(int excelRow, Map<Column, String> cells) {}

    private List<SheetData> read(byte[] bytes) {
        List<SheetData> result = new ArrayList<>();
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            int total = 0;
            for (Sheet sheet : wb) {
                if (ProductSheetFormat.normalize(sheet.getSheetName())
                        .equals(ProductSheetFormat.normalize(ProductSheetFormat.GUIDE_SHEET))) {
                    continue;
                }
                SheetData data = readSheet(sheet);
                if (data != null) {
                    total += data.rows().size();
                    if (total > MAX_ROWS) {
                        throw ApiException.validation("file", "At most " + MAX_ROWS + " product rows per file");
                    }
                    result.add(data);
                }
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ApiException api) {
                throw api;
            }
            throw ApiException.validation("file", "The file is not a valid .xlsx workbook");
        }
        return result;
    }

    /** {@code null} for a sheet without a recognisable header row (notes, pivot tables...). */
    private static SheetData readSheet(Sheet sheet) {
        String categoryKey = ProductSheetFormat.normalize(sheet.getSheetName());
        for (int h = sheet.getFirstRowNum(); h < sheet.getFirstRowNum() + HEADER_SEARCH_ROWS; h++) {
            Row header = sheet.getRow(h);
            if (header == null) {
                continue;
            }
            List<Column> columns = columns(header, categoryKey);
            boolean hasKey = columns.stream()
                    .anyMatch(c -> c.field() == Field.NAME || c.field() == Field.SKU || c.field() == Field.CODE);
            if (!hasKey) {
                continue;
            }
            List<RowData> rows = new ArrayList<>();
            for (int r = h + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                Map<Column, String> cells = new LinkedHashMap<>();
                for (Column c : columns) {
                    cells.put(c, cellText(row.getCell(c.index())));
                }
                if (cells.values().stream().anyMatch(Objects::nonNull)) {
                    rows.add(new RowData(r + 1, cells));
                }
            }
            return new SheetData(sheet.getSheetName(), categoryKey, columns, rows);
        }
        return null;
    }

    private static List<Column> columns(Row header, String categoryKey) {
        List<SpecColumn> known = ProductSheetFormat.SPECS.entrySet().stream()
                .filter(e -> ProductSheetFormat.normalize(e.getKey()).equals(categoryKey))
                .flatMap(e -> e.getValue().stream())
                .toList();
        List<Column> columns = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Cell cell : header) {
            String text = cellText(cell);
            String norm = ProductSheetFormat.normalize(text);
            if (norm.isEmpty() || !seen.add(norm)) {
                continue;
            }
            int index = cell.getColumnIndex();
            Field field = null;
            for (Field f : Field.values()) {
                if (f != Field.IGNORED && f.matches(norm)) {
                    field = f;
                    break;
                }
            }
            if (field != null) {
                columns.add(new Column(index, field, null, null));
                continue;
            }
            SpecColumn spec =
                    known.stream().filter(s -> s.matches(norm)).findFirst().orElse(null);
            if (spec != null) {
                columns.add(new Column(index, null, spec, null));
            } else if (!Field.IGNORED.matches(norm)) {
                columns.add(new Column(index, null, null, text.strip()));
            }
        }
        return columns;
    }

    private static String cellText(Cell cell) {
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
        String s =
                switch (type) {
                    case STRING -> cell.getRichStringCellValue().getString();
                    case NUMERIC ->
                        DateUtil.isCellDateFormatted(cell)
                                ? FORMATTER.formatCellValue(cell)
                                : BigDecimal.valueOf(cell.getNumericCellValue())
                                        .stripTrailingZeros()
                                        .toPlainString();
                    case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                    default -> null;
                };
        if (s == null) {
            return null;
        }
        s = s.strip();
        return s.isEmpty() ? null : s;
    }

    // --- Applying rows ------------------------------------------------------------------------------------------

    /** State of one run: results, what this file already touched, and pages to refresh. */
    private static final class Run {
        final List<SheetIssue> errors = new ArrayList<>();
        final List<RowResult> rows = new ArrayList<>();
        final List<String> newSubCategories = new ArrayList<>();
        final Set<String> touchedSlugs = new HashSet<>();
        final Set<String> assignedSkus = new HashSet<>();
        final Set<String> paths = new LinkedHashSet<>();

        SheetImportReport report(boolean applied) {
            int created = 0;
            int updated = 0;
            int unchanged = 0;
            int failed = 0;
            List<SheetRowResult> out = new ArrayList<>();
            for (RowResult r : rows) {
                switch (r.action) {
                    case "CREATE" -> created++;
                    case "UPDATE" -> updated++;
                    case "UNCHANGED" -> unchanged++;
                    default -> failed++;
                }
                // Products created by a check run were rolled back: their id does not exist.
                boolean keepId = applied || !r.action.equals("CREATE");
                out.add(new SheetRowResult(
                        r.sheet,
                        r.row,
                        r.action,
                        keepId && r.product != null ? r.product.getId() : null,
                        r.product == null ? r.slug : r.product.getSlug(),
                        r.name,
                        List.copyOf(r.changes),
                        List.copyOf(r.errors)));
            }
            return new SheetImportReport(
                    applied,
                    created,
                    updated,
                    unchanged,
                    failed,
                    List.copyOf(newSubCategories),
                    List.copyOf(errors),
                    out);
        }
    }

    private static final class RowResult {
        final String sheet;
        final int row;
        String action = "UNCHANGED";
        Product product;
        String slug;
        String name;
        final List<SheetChange> changes = new ArrayList<>();
        final List<SheetIssue> errors = new ArrayList<>();

        RowResult(String sheet, int row) {
            this.sheet = sheet;
            this.row = row;
        }

        void error(String code, String value) {
            errors.add(new SheetIssue(code, value));
        }

        void change(String field, String label, Object from, Object to) {
            String a = from == null ? null : from.toString();
            String b = to == null ? null : to.toString();
            if (!Objects.equals(a, b)) {
                changes.add(new SheetChange(field, label, a, b));
            }
        }
    }

    private void processSheet(SheetData sheet, Run run) {
        Category category = categories.findAll().stream()
                .filter(c -> sheet.categoryKey().equals(ProductSheetFormat.normalize(c.getSlug()))
                        || c.getName().values().stream()
                                .map(ProductSheetFormat::normalize)
                                .anyMatch(sheet.categoryKey()::equals))
                .findFirst()
                .orElse(null);
        if (category == null) {
            run.errors.add(new SheetIssue("UNKNOWN_CATEGORY", sheet.name()));
            return;
        }
        for (RowData row : sheet.rows()) {
            RowResult result = new RowResult(sheet.name(), row.excelRow());
            run.rows.add(result);
            processRow(category, row, result, run);
            if (!result.errors.isEmpty()) {
                result.action = "ERROR";
            }
        }
    }

    private void processRow(Category category, RowData row, RowResult result, Run run) {
        Map<Field, String> v = new LinkedHashMap<>();
        Set<Field> present = new HashSet<>();
        row.cells().forEach((c, value) -> {
            if (c.field() != null) {
                present.add(c.field());
                if (value != null) {
                    v.put(c.field(), value);
                }
            }
        });
        String code = v.get(Field.CODE);
        String sku = v.get(Field.SKU);
        String brand = v.get(Field.BRAND);
        String explicitName = v.get(Field.NAME);
        String name = explicitName != null ? explicitName : generatedName(brand, sku);
        result.name = name;

        // Parse every cell first so all problems of the row are reported together.
        Long price = null;
        if (present.contains(Field.PRICE)) {
            price = parsePrice(v.get(Field.PRICE), result);
        }
        Integer warranty = null;
        if (v.containsKey(Field.WARRANTY)) {
            warranty = ProductSheetFormat.parseWarrantyMonths(v.get(Field.WARRANTY));
            if (warranty == null || warranty < 0 || warranty > 240) {
                result.error("BAD_WARRANTY", v.get(Field.WARRANTY));
            }
        }
        StockStatus stock = null;
        if (v.containsKey(Field.STOCK)) {
            stock = ProductSheetFormat.parseEnum(v.get(Field.STOCK), ProductSheetFormat.STOCK_LABEL);
            if (stock == null) {
                result.error("BAD_STOCK", v.get(Field.STOCK));
            }
        }
        ProductStatus status = null;
        if (v.containsKey(Field.STATUS)) {
            status = ProductSheetFormat.parseEnum(v.get(Field.STATUS), ProductSheetFormat.STATUS_LABEL);
            if (status == null) {
                result.error("BAD_STATUS", v.get(Field.STATUS));
            }
        }
        checkLength(result, "NAME_TOO_LONG", name, 200);
        checkLength(result, "SKU_TOO_LONG", sku, 50);
        checkLength(result, "BRAND_TOO_LONG", brand, 60);

        // Find the product: code, then SKU, then the slug of the name.
        Product product = null;
        if (code != null) {
            product = products.findBySlug(code).orElse(null);
            if (product == null) {
                result.error("UNKNOWN_CODE", code);
                return;
            }
        }
        if (product == null && sku != null) {
            product = products.findBySku(sku).orElse(null);
        }
        String slug = name == null ? null : ProductSheetFormat.slugify(name);
        result.slug = code != null ? code : slug;
        if (product == null && slug != null && !slug.isEmpty()) {
            product = products.findBySlug(slug).orElse(null);
        }
        if (product != null && !product.getCategory().getId().equals(category.getId())) {
            result.error("WRONG_CATEGORY", product.getCategory().getSlug());
            return;
        }
        String identity = product != null ? product.getSlug() : slug;
        if (identity != null && !run.touchedSlugs.add(identity)) {
            result.error("DUPLICATE_ROW", identity);
            return;
        }
        if (sku != null && !run.assignedSkus.add(sku)) {
            result.error("DUPLICATE_SKU", sku);
        }
        if (sku != null) {
            products.findBySku(sku)
                    .filter(other -> !other.getSlug().equals(identity))
                    .ifPresent(other -> result.error("SKU_TAKEN", sku + " → " + other.getSlug()));
        }

        boolean created = product == null;
        if (created) {
            if (name == null) {
                result.error("NAME_REQUIRED", null);
            }
            if (brand == null) {
                result.error("BRAND_REQUIRED", null);
            }
            if (slug == null || slug.isEmpty() || slug.length() > 120) {
                if (name != null) {
                    result.error("BAD_NAME", name);
                }
            }
        }
        if (!result.errors.isEmpty()) {
            return;
        }

        SubCategory sub = null;
        if (v.containsKey(Field.SUB_CATEGORY)) {
            sub = subCategory(category, v.get(Field.SUB_CATEGORY), run);
        }

        if (created) {
            product = new Product();
            product.setSlug(slug);
            product.setCategory(category);
            product.setStockStatus(StockStatus.IN_STOCK);
            product.setStatus(ProductStatus.DRAFT);
        }
        result.product = product;
        result.action = created ? "CREATE" : "UPDATE";

        // Scalar fields.
        if (brand != null) {
            result.change("BRAND", null, product.getBrand(), brand);
            product.setBrand(brand);
        }
        if (sku != null) {
            result.change("SKU", null, product.getSku(), sku);
            product.setSku(sku);
        }
        if (sub != null) {
            result.change("SUB_CATEGORY", null, subName(product.getSubCategory()), subName(sub));
            product.setSubCategory(sub);
        }
        if (present.contains(Field.PRICE)) {
            result.change("PRICE", null, product.getPrice(), price);
            product.setPrice(price);
        }
        if (stock != null) {
            result.change("STOCK", null, created ? null : product.getStockStatus(), stock);
            product.setStockStatus(stock);
        }
        if (status != null) {
            result.change("STATUS", null, created ? null : product.getStatus(), status);
            product.setStatus(status);
        } else if (created) {
            result.change("STATUS", null, null, ProductStatus.DRAFT);
        }
        if (product.getStatus() == ProductStatus.PUBLISHED && product.getPublishedAt() == null) {
            product.setPublishedAt(clock.instant());
        }

        // Specs: the sheet value is written to every locale; empty cells keep what is there.
        List<SpecRow> specs = new ArrayList<>(product.getSpecs());
        for (var cell : row.cells().entrySet()) {
            Column c = cell.getKey();
            String value = cell.getValue();
            if (value == null || c.field() != null) {
                continue;
            }
            String key = c.spec() != null ? c.spec().key() : customKey(c.customHeader());
            Map<String, String> label =
                    c.spec() != null ? c.spec().label() : ProductSheetFormat.sameForAll(c.customHeader());
            if (key.isEmpty()) {
                continue;
            }
            setSpec(specs, key, label, ProductSheetFormat.sameForAll(value), result);
        }
        if (warranty != null) {
            setSpec(
                    specs,
                    ProductSheetFormat.WARRANTY_KEY,
                    ProductSheetFormat.WARRANTY_LABEL,
                    ProductSheetFormat.warrantyValue(warranty),
                    result);
        }
        product.setSpecs(specs);

        // Name: only an explicit cell renames an existing product; it is written to every locale.
        if (!created && explicitName != null) {
            String old = product.translation(CatalogMapper.DEFAULT_LOCALE)
                    .map(ProductTranslation::getName)
                    .orElse(null);
            if (!explicitName.equals(old)) {
                result.change("NAME", null, old, explicitName);
                for (String locale : CatalogMapper.LOCALES) {
                    product.translationFor(locale).setName(explicitName);
                }
            }
        }
        if (!created) {
            result.name = product.translation(CatalogMapper.DEFAULT_LOCALE)
                    .map(ProductTranslation::getName)
                    .orElse(name);
        }

        if (created) {
            result.change("NAME", null, null, name);
            product = products.saveAndFlush(product);
            result.product = product;
            ProductSheetContent.fill(product, name, category, warranty);
        } else if (result.changes.isEmpty()) {
            result.action = "UNCHANGED";
            return;
        }
        products.flush();
        search.reindex(product.getId());
        run.paths.add("/products/" + product.getSlug());
        run.paths.add("/category/" + category.getSlug());
    }

    private static void setSpec(
            List<SpecRow> specs, String key, Map<String, String> label, Map<String, String> value, RowResult result) {
        for (int i = 0; i < specs.size(); i++) {
            SpecRow s = specs.get(i);
            if (key.equals(s.key())) {
                String old = CatalogMapper.pick(s.value(), CatalogMapper.DEFAULT_LOCALE);
                String now = value.get(CatalogMapper.DEFAULT_LOCALE);
                if (!now.equals(old)) {
                    result.change("SPEC", CatalogMapper.pick(s.label(), CatalogMapper.DEFAULT_LOCALE), old, now);
                    specs.set(i, new SpecRow(s.key(), s.label(), value));
                }
                return;
            }
        }
        result.change("SPEC", label.get(CatalogMapper.DEFAULT_LOCALE), null, value.get(CatalogMapper.DEFAULT_LOCALE));
        // Keep warranty as the last row, as in the curated catalog.
        int at = specs.size();
        if (!key.equals(ProductSheetFormat.WARRANTY_KEY)
                && !specs.isEmpty()
                && ProductSheetFormat.WARRANTY_KEY.equals(specs.get(at - 1).key())) {
            at--;
        }
        specs.add(at, new SpecRow(key, label, value));
    }

    private SubCategory subCategory(Category category, String text, Run run) {
        String slug = ProductSheetFormat.slugify(text);
        String norm = ProductSheetFormat.normalize(text);
        return category.getSubCategories().stream()
                .filter(s -> s.getSlug().equals(slug)
                        || s.getName().values().stream()
                                .map(ProductSheetFormat::normalize)
                                .anyMatch(norm::equals))
                .findFirst()
                .orElseGet(() -> {
                    SubCategory s = new SubCategory();
                    s.setCategory(category);
                    s.setSlug(slug.length() > 80 ? slug.substring(0, 80) : slug);
                    s.setName(ProductSheetFormat.sameForAll(text));
                    s.setSortOrder(category.getSubCategories().size());
                    category.getSubCategories().add(s);
                    subCategories.saveAndFlush(s);
                    run.newSubCategories.add(category.getSlug() + " / " + text);
                    return s;
                });
    }

    private static Long parsePrice(String text, RowResult result) {
        if (text == null) {
            return null;
        }
        String norm = ProductSheetFormat.normalize(text).replace(" ", "");
        if (norm.equals("lienhe") || norm.equals("contact")) {
            return null;
        }
        String compact = text.toLowerCase(java.util.Locale.ROOT)
                .replace("₫", "")
                .replace("đ", "d")
                .strip();
        if (!PRICE_TEXT.matcher(compact).matches()) {
            result.error("BAD_PRICE", text);
            return null;
        }
        // A plain number from a numeric cell may carry decimals ("3588000.5"); anything else uses . or , as grouping.
        if (compact.matches("^[0-9]+\\.[0-9]{1,2}$")) {
            return new BigDecimal(compact).setScale(0, RoundingMode.HALF_UP).longValueExact();
        }
        String digits = compact.replaceAll("[^0-9]", "");
        if (digits.length() > 15) {
            result.error("BAD_PRICE", text);
            return null;
        }
        return Long.parseLong(digits);
    }

    private static void checkLength(RowResult result, String code, String value, int max) {
        if (value != null && value.length() > max) {
            result.error(code, value.substring(0, Math.min(value.length(), 40)) + "…");
        }
    }

    /** "AMD" + "Epyc 7F32" → "AMD Epyc 7F32"; "JetKVM" + "JetKVM" → "JetKVM". */
    static String generatedName(String brand, String sku) {
        if (sku == null) {
            return null;
        }
        if (brand == null || ProductSheetFormat.normalize(sku).startsWith(ProductSheetFormat.normalize(brand))) {
            return sku;
        }
        return brand + " " + sku;
    }

    private static String customKey(String header) {
        String key = ProductSheetFormat.slugify(header);
        return key.length() > 60 ? key.substring(0, 60) : key;
    }

    private static String subName(SubCategory sub) {
        return sub == null ? null : CatalogMapper.pick(sub.getName(), CatalogMapper.DEFAULT_LOCALE);
    }

    private static Map<String, Object> summary(SheetImportReport report) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("created", report.created());
        s.put("updated", report.updated());
        s.put("unchanged", report.unchanged());
        s.put("newSubCategories", report.newSubCategories());
        s.put(
                "products",
                report.rows().stream()
                        .filter(r -> r.action().equals("CREATE") || r.action().equals("UPDATE"))
                        .map(r -> Map.of("slug", r.slug(), "action", r.action(), "changes", r.changes()))
                        .toList());
        return s;
    }
}
