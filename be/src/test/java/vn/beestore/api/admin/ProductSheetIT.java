package vn.beestore.api.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static vn.beestore.api.support.AuthSupport.PASSWORD;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.AuthSupport.Session;
import vn.beestore.api.support.CatalogFixture;
import vn.beestore.api.support.IntegrationTest;

/** Price list workbook: download, check run, create, update and all-or-nothing errors. */
class ProductSheetIT extends IntegrationTest {

    private static final List<String> HEADERS = List.of(
            "Mã sản phẩm",
            "Dòng",
            "Thương hiệu",
            "SKU / Model",
            "Tên sản phẩm",
            "Số nhân / luồng",
            "Xung boost tối đa",
            "Giá (VND)",
            "Bảo hành (tháng)",
            "Tình trạng kho",
            "Trạng thái");

    @Autowired
    CatalogImporter importer;

    @Autowired
    PasswordEncoder passwordEncoder;

    Session admin;

    @BeforeEach
    void setUp() throws Exception {
        CatalogFixture.ensureImported(importer);
        admin = AuthSupport.newAdmin(mvc, jdbc, passwordEncoder.encode(PASSWORD));
    }

    @Test
    void downloadHasOneSheetPerCategoryFilledWithTheCatalog() throws Exception {
        byte[] bytes = mvc.perform(get("/api/v1/admin/products/sheet").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".xlsx")))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        try (XSSFWorkbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(wb.getSheetName(0)).isEqualTo("Hướng dẫn");
            Sheet cpu = wb.getSheet("CPU");
            assertThat(cpu).isNotNull();
            assertThat(cpu.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Mã sản phẩm");
            boolean found = false;
            for (Row row : cpu) {
                if (row.getCell(0) != null
                        && "amd-epyc-7402".equals(row.getCell(0).getStringCellValue())) {
                    found = true;
                    assertThat(row.getCell(1).getStringCellValue()).isEqualTo("Zen 2");
                }
            }
            assertThat(found).isTrue();
        }

        // The untouched download imports as "nothing to change".
        upload(bytes, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.errors").isEmpty())
                .andExpect(jsonPath("$.data.created").value(0))
                .andExpect(jsonPath("$.data.updated").value(0));
    }

    @Test
    void newRowCreatesADraftWithGeneratedContentAndLaterRowsUpdateOnlyChangedCells() throws Exception {
        String model = "Epyc T" + System.nanoTime() % 1_000_000;
        String slug = "amd-" + model.toLowerCase().replace(' ', '-');
        byte[] create = workbook(
                "CPU",
                List.<String[]>of(row(
                        null, "Zen 4 Test", "AMD", model, null, "96 / 192", "3.7 GHz", "45000000", "12", null, null)));

        // Check run: reported, nothing written.
        upload(create, false)
                .andExpect(jsonPath("$.data.applied").value(false))
                .andExpect(jsonPath("$.data.created").value(1))
                .andExpect(jsonPath("$.data.rows[0].action").value("CREATE"))
                .andExpect(jsonPath("$.data.rows[0].slug").value(slug))
                .andExpect(jsonPath("$.data.rows[0].productId").doesNotExist());
        assertThat(count("select count(*) from products where slug = ?", slug)).isZero();

        upload(create, true)
                .andExpect(jsonPath("$.data.applied").value(true))
                .andExpect(jsonPath("$.data.newSubCategories[0]").value("cpu / Zen 4 Test"));
        assertThat(jdbc.queryForObject("select status from products where slug = ?", String.class, slug))
                .isEqualTo("DRAFT");
        assertThat(jdbc.queryForObject("select price from products where slug = ?", Long.class, slug))
                .isEqualTo(45_000_000L);
        assertThat(jdbc.queryForObject(
                        "select t.name from product_translations t join products p on p.id = t.product_id"
                                + " where p.slug = ? and t.locale = 'zh'",
                        String.class,
                        slug))
                .isEqualTo("AMD " + model);
        String description = jdbc.queryForObject(
                "select t.description from product_translations t join products p on p.id = t.product_id"
                        + " where p.slug = ? and t.locale = 'vi'",
                String.class,
                slug);
        assertThat(description).contains("Số nhân / luồng: 96 / 192").contains("Bảo hành 12 tháng");

        // Second file: by code, new price, publish; the description written above must survive.
        jdbc.update(
                "update product_translations set description = 'Viết tay' where locale = 'vi' and product_id ="
                        + " (select id from products where slug = ?)",
                slug);
        byte[] update = workbook(
                "CPU",
                List.<String[]>of(row(
                        slug,
                        null,
                        null,
                        null,
                        null,
                        "96 / 192",
                        "3.8 GHz",
                        "44.500.000 đ",
                        "36",
                        "Hết hàng",
                        "Đang bán")));
        upload(update, true)
                .andExpect(jsonPath("$.data.updated").value(1))
                .andExpect(jsonPath("$.data.rows[0].changes[?(@.field == 'PRICE')].to")
                        .value("44500000"))
                .andExpect(jsonPath("$.data.rows[0].changes[?(@.field == 'SPEC')].label")
                        .value(org.hamcrest.Matchers.containsInAnyOrder("Xung boost tối đa", "Bảo hành")));
        assertThat(jdbc.queryForObject(
                        "select status || ' ' || stock_status || ' ' || price from products where slug = ?",
                        String.class,
                        slug))
                .isEqualTo("PUBLISHED OUT_OF_STOCK 44500000");
        assertThat(jdbc.queryForObject(
                        "select t.description from product_translations t join products p on p.id = t.product_id"
                                + " where p.slug = ? and t.locale = 'vi'",
                        String.class,
                        slug))
                .isEqualTo("Viết tay");
        mvc.perform(get("/api/v1/products/" + slug + "?locale=en"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.data.specs[?(@.key == 'warranty')].value").value("36 months"));

        // Same file again: nothing to do.
        upload(update, true).andExpect(jsonPath("$.data.unchanged").value(1));

        // The catalog tests count published products in this shared database.
        String id = jdbc.queryForObject("select id::text from products where slug = ?", String.class, slug);
        mvc.perform(delete("/api/v1/admin/products/" + id).header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());
        jdbc.update("delete from sub_categories where slug = 'zen-4-test'");
    }

    @Test
    void anyErrorBlocksTheWholeImport() throws Exception {
        String model = "Epyc E" + System.nanoTime() % 1_000_000;
        byte[] bad = workbook(
                "CPU",
                List.<String[]>of(
                        row(null, "Zen 2", "AMD", model, null, null, null, "1000000", null, null, null),
                        row(null, "Zen 2", "AMD", model + "X", null, null, null, "giá tốt", null, "Còn", null),
                        row("does-not-exist", null, null, null, null, null, null, null, null, null, null)));
        upload(bad, true)
                .andExpect(jsonPath("$.data.applied").value(false))
                .andExpect(jsonPath("$.data.failed").value(2))
                .andExpect(jsonPath("$.data.rows[1].errors[*].code")
                        .value(org.hamcrest.Matchers.containsInAnyOrder("BAD_PRICE", "BAD_STOCK")))
                .andExpect(jsonPath("$.data.rows[2].errors[0].code").value("UNKNOWN_CODE"));
        assertThat(count("select count(*) from products where sku = ?", model)).isZero();

        upload(
                        workbook(
                                "Không có",
                                List.<String[]>of(
                                        row(null, null, "AMD", "X1", null, null, null, null, null, null, null))),
                        false)
                .andExpect(jsonPath("$.data.errors[0].code").value("UNKNOWN_CATEGORY"));

        mvc.perform(multipart("/api/v1/admin/products/sheet")
                        .file(new MockMultipartFile(
                                "file", "a.xlsx", "application/octet-stream", "not excel".getBytes()))
                        .header("Authorization", admin.bearer()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customersCannotUseIt() throws Exception {
        Session customer = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(get("/api/v1/admin/products/sheet").header("Authorization", customer.bearer()))
                .andExpect(status().isForbidden());
    }

    // --- helpers ----------------------------------------------------------------------------------------------------

    private ResultActions upload(byte[] bytes, boolean apply) throws Exception {
        return mvc.perform(multipart("/api/v1/admin/products/sheet")
                .file(new MockMultipartFile("file", "bang-gia.xlsx", "application/octet-stream", bytes))
                .param("apply", String.valueOf(apply))
                .header("Authorization", admin.bearer()));
    }

    private static String[] row(String... cells) {
        return cells;
    }

    private static byte[] workbook(String sheetName, List<String[]> rows) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(sheetName);
            Row head = sheet.createRow(0);
            for (int i = 0; i < HEADERS.size(); i++) {
                head.createCell(i).setCellValue(HEADERS.get(i));
            }
            for (int r = 0; r < rows.size(); r++) {
                Row row = sheet.createRow(r + 1);
                String[] cells = rows.get(r);
                for (int i = 0; i < cells.length; i++) {
                    if (cells[i] != null) {
                        row.createCell(i).setCellValue(cells[i]);
                    }
                }
            }
            wb.write(out);
            return out.toByteArray();
        }
    }

    private long count(String sql, Object arg) {
        Long n = jdbc.queryForObject(sql, Long.class, arg);
        return n == null ? 0 : n;
    }
}
