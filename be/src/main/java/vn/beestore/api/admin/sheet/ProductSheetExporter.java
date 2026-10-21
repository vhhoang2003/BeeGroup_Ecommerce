package vn.beestore.api.admin.sheet;

import static vn.beestore.api.admin.sheet.ProductSheetFormat.Field;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.apache.poi.ss.SpreadsheetVersion;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.admin.sheet.ProductSheetFormat.SpecColumn;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductTranslation;
import vn.beestore.api.catalog.domain.SpecRow;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.service.CatalogMapper;

/**
 * Writes the standard price list workbook ({@link ProductSheetFormat}) filled with the current catalog, so admins can
 * edit it and import it back. Rows past the last product are left formatted for new products.
 */
@Service
public class ProductSheetExporter {

    /** Extra formatted rows below the products, ready for new entries. */
    private static final int SPARE_ROWS = 30;

    private final CategoryRepository categories;
    private final ProductRepository products;

    public ProductSheetExporter(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public byte[] export() {
        try (XSSFWorkbook wb = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Styles styles = new Styles(wb);
            writeGuide(wb, styles);
            for (Category category : categories.findAll(Sort.by("sortOrder", "slug"))) {
                writeCategory(wb, styles, category);
            }
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private void writeCategory(XSSFWorkbook wb, Styles styles, Category category) {
        String name = CatalogMapper.pick(category.getName(), CatalogMapper.DEFAULT_LOCALE);
        Sheet sheet = wb.createSheet(WorkbookUtil.createSafeSheetName(name.isBlank() ? category.getSlug() : name));
        List<SpecColumn> specs = ProductSheetFormat.specsFor(category.getSlug());

        List<String> headers = new ArrayList<>();
        for (Field f : List.of(Field.CODE, Field.SUB_CATEGORY, Field.BRAND, Field.SKU, Field.NAME)) {
            headers.add(f.header());
        }
        specs.forEach(s -> headers.add(s.label().get("vi")));
        for (Field f : List.of(Field.PRICE, Field.WARRANTY, Field.STOCK, Field.STATUS)) {
            headers.add(f.header());
        }
        int priceCol = 5 + specs.size();

        Row head = sheet.createRow(0);
        head.setHeightInPoints(32);
        for (int i = 0; i < headers.size(); i++) {
            Cell cell = head.createCell(i);
            cell.setCellValue(headers.get(i));
            cell.setCellStyle(styles.header);
        }

        List<Product> rows =
                products.findAll((root, q, cb) -> cb.equal(root.get("category").get("id"), category.getId())).stream()
                        .sorted(Comparator.comparingInt((Product p) -> p.getSubCategory() == null
                                        ? Integer.MAX_VALUE
                                        : p.getSubCategory().getSortOrder())
                                .thenComparing(ProductSheetExporter::legacyOrder)
                                .thenComparing(ProductSheetExporter::viName))
                        .toList();

        int r = 1;
        for (Product p : rows) {
            Row row = sheet.createRow(r++);
            int c = 0;
            text(row, c++, p.getSlug(), styles.code);
            text(row, c++, subName(p.getSubCategory()), styles.text);
            text(row, c++, p.getBrand(), styles.text);
            text(row, c++, p.getSku(), styles.text);
            text(row, c++, viName(p), styles.text);
            for (SpecColumn spec : specs) {
                text(row, c++, specValue(p, spec.key()), styles.text);
            }
            Cell price = row.createCell(c++);
            price.setCellStyle(styles.price);
            if (p.getPrice() != null) {
                price.setCellValue(p.getPrice());
            }
            Cell warranty = row.createCell(c++);
            warranty.setCellStyle(styles.number);
            Integer months = ProductSheetFormat.parseWarrantyMonths(specValue(p, ProductSheetFormat.WARRANTY_KEY));
            if (months != null) {
                warranty.setCellValue(months);
            }
            text(row, c++, ProductSheetFormat.STOCK_LABEL.get(p.getStockStatus()), styles.text);
            text(row, c, ProductSheetFormat.STATUS_LABEL.get(p.getStatus()), styles.text);
        }
        int lastRow = r + SPARE_ROWS - 1;
        for (; r <= lastRow; r++) {
            Row row = sheet.createRow(r);
            for (int c = 0; c < headers.size(); c++) {
                row.createCell(c)
                        .setCellStyle(
                                c == 0
                                        ? styles.code
                                        : c == priceCol
                                                ? styles.price
                                                : c == priceCol + 1 ? styles.number : styles.text);
            }
        }

        DataValidationHelper dv = sheet.getDataValidationHelper();
        addList(sheet, dv, priceCol + 2, lastRow, ProductSheetFormat.STOCK_LABEL.values());
        addList(sheet, dv, priceCol + 3, lastRow, ProductSheetFormat.STATUS_LABEL.values());

        sheet.createFreezePane(1, 1);
        sheet.setAutoFilter(new CellRangeAddress(0, Math.max(rows.size(), 1), 0, headers.size() - 1));
        for (int i = 0; i < headers.size(); i++) {
            int width = i == 0 ? 26 : i == 4 ? 34 : i == priceCol ? 14 : i < 4 ? 14 : 20;
            sheet.setColumnWidth(i, Math.min(width, 60) * 256);
        }
    }

    private static void addList(
            Sheet sheet, DataValidationHelper dv, int col, int lastRow, java.util.Collection<String> values) {
        DataValidation validation = dv.createValidation(
                dv.createExplicitListConstraint(values.toArray(String[]::new)),
                new CellRangeAddressList(
                        1, Math.min(lastRow, SpreadsheetVersion.EXCEL2007.getLastRowIndex()), col, col));
        validation.setShowErrorBox(true);
        sheet.addValidationData(validation);
    }

    private static void writeGuide(XSSFWorkbook wb, Styles styles) {
        Sheet sheet = wb.createSheet(ProductSheetFormat.GUIDE_SHEET);
        String[][] lines = {
            {"BẢNG GIÁ CHUẨN – BEE STORE", ""},
            {"", ""},
            {"Mỗi sheet là một danh mục (CPU, Mainboard...). Tên sheet phải trùng tên danh mục trên web.", ""},
            {"Mỗi dòng là một sản phẩm. Dòng trống được bỏ qua.", ""},
            {"", ""},
            {"Cột", "Cách điền"},
            {Field.CODE.header(), "Do hệ thống sinh ra, KHÔNG sửa. Để trống khi thêm sản phẩm mới."},
            {Field.SUB_CATEGORY.header(), "Ví dụ Zen 2, Zen 3, Gigabyte, AIO. Dòng chưa có sẽ được tạo mới."},
            {Field.BRAND.header(), "Bắt buộc với sản phẩm mới. Ví dụ AMD, GIGABYTE, NVIDIA."},
            {Field.SKU.header(), "Mã model, ví dụ Epyc 7F32. Không được trùng giữa các sản phẩm."},
            {Field.NAME.header(), "Để trống thì tự đặt = Thương hiệu + Model, ví dụ AMD Epyc 7F32."},
            {"Các cột thông số", "Ví dụ Số nhân / luồng, Xung cơ bản. Có thể thêm cột mới: tên cột thành tên thông số."
            },
            {Field.PRICE.header(), "Chỉ nhập số, ví dụ 3588000. Để trống = hiện \"Liên hệ\" trên web."},
            {Field.WARRANTY.header(), "Số tháng, ví dụ 12. Cũng nhận \"1 year\", \"3 tháng\"."},
            {Field.STOCK.header(), "Còn hàng / Sắp hết hàng / Hết hàng / Đặt trước. Trống = Còn hàng."},
            {Field.STATUS.header(), "Đang bán / Nháp / Lưu trữ. Sản phẩm mới để trống = Nháp (thêm ảnh rồi mới đăng)."},
            {"", ""},
            {"Khi nhập file", ""},
            {"• Sản phẩm đã có: chỉ cập nhật các ô khác với web. Mô tả, ảnh và các thông số khác giữ nguyên.", ""},
            {"• Sản phẩm mới: hệ thống tự sinh mã, tên, thông số và mô tả 3 ngôn ngữ. Ảnh tải lên sau trong Admin.", ""
            },
            {"• Ô thông số để trống thì giữ nguyên giá trị cũ. Xoá sản phẩm thì làm trong Admin.", ""},
            {"• Luôn bấm \"Kiểm tra\" trước để xem thay đổi, sau đó mới \"Áp dụng\".", ""},
        };
        for (int i = 0; i < lines.length; i++) {
            Row row = sheet.createRow(i);
            for (int c = 0; c < 2; c++) {
                Cell cell = row.createCell(c);
                cell.setCellValue(lines[i][c]);
                cell.setCellStyle(i == 0 || i == 5 || i == 17 ? styles.bold : styles.text);
            }
        }
        sheet.setColumnWidth(0, 30 * 256);
        sheet.setColumnWidth(1, 90 * 256);
    }

    // --- values ---------------------------------------------------------------------------------------------------

    private static String viName(Product p) {
        return p.translation(CatalogMapper.DEFAULT_LOCALE)
                .map(ProductTranslation::getName)
                .orElse(p.getSlug());
    }

    private static int legacyOrder(Product p) {
        try {
            return p.getLegacyId() == null ? Integer.MAX_VALUE : Integer.parseInt(p.getLegacyId());
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private static String subName(SubCategory sub) {
        return sub == null ? null : CatalogMapper.pick(sub.getName(), CatalogMapper.DEFAULT_LOCALE);
    }

    static String specValue(Product p, String key) {
        return p.getSpecs().stream()
                .filter(s -> key.equals(s.key()))
                .findFirst()
                .map(SpecRow::value)
                .map(v -> CatalogMapper.pick(v, CatalogMapper.DEFAULT_LOCALE))
                .orElse(null);
    }

    private static void text(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellStyle(style);
        if (value != null) {
            cell.setCellValue(value);
        }
    }

    private static final class Styles {
        final CellStyle header;
        final CellStyle text;
        final CellStyle code;
        final CellStyle price;
        final CellStyle number;
        final CellStyle bold;

        Styles(XSSFWorkbook wb) {
            Font white = wb.createFont();
            white.setBold(true);
            white.setColor(IndexedColors.WHITE.getIndex());
            XSSFCellStyle h = wb.createCellStyle();
            h.setFont(white);
            h.setFillForegroundColor(new XSSFColor(new byte[] {0x21, 0x28, 0x44}, null));
            h.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            h.setWrapText(true);
            h.setVerticalAlignment(VerticalAlignment.CENTER);
            header = h;

            text = bordered(wb);
            text.setWrapText(true);

            Font grey = wb.createFont();
            grey.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            code = bordered(wb);
            code.setFont(grey);

            price = bordered(wb);
            price.setDataFormat(wb.createDataFormat().getFormat("#,##0"));
            number = bordered(wb);
            number.setDataFormat(wb.createDataFormat().getFormat("0"));

            Font b = wb.createFont();
            b.setBold(true);
            bold = wb.createCellStyle();
            bold.setFont(b);
        }

        private static CellStyle bordered(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            s.setBorderBottom(BorderStyle.HAIR);
            s.setBorderRight(BorderStyle.HAIR);
            s.setVerticalAlignment(VerticalAlignment.TOP);
            return s;
        }
    }
}
