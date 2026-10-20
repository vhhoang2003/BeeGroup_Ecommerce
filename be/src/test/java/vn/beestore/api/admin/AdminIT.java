package vn.beestore.api.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static vn.beestore.api.support.AuthSupport.PASSWORD;

import com.jayway.jsonpath.JsonPath;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.AuthSupport.Session;
import vn.beestore.api.support.CatalogFixture;
import vn.beestore.api.support.IntegrationTest;

/** ADM-01..08. */
class AdminIT extends IntegrationTest {

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

    // --- Products (ADM-02) ---------------------------------------------------------------------------------------

    @Test
    void productLifecycleDraftPublishEditDelete() throws Exception {
        String slug = "test-cpu-" + System.nanoTime();
        String created = mvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson(slug, "DRAFT", 12_000_000L)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.translations.vi.name").value("CPU thử nghiệm"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = JsonPath.read(created, "$.data.id");

        mvc.perform(get("/api/v1/products/" + slug)).andExpect(status().isNotFound());

        mvc.perform(patch("/api/v1/admin/products/" + id + "/status")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.publishedAt").isNotEmpty());
        mvc.perform(get("/api/v1/products/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("CPU thử nghiệm"))
                .andExpect(jsonPath("$.data.specs[0].value").value("SP3"));
        mvc.perform(get("/api/v1/products/suggestions?q=thử nghiệm"))
                .andExpect(jsonPath("$.data[0].slug").value(slug));

        String renamed = slug + "-v2";
        mvc.perform(put("/api/v1/admin/products/" + id)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson(renamed, "PUBLISHED", 11_500_000L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value(renamed))
                .andExpect(jsonPath("$.data.price").value(11500000));
        mvc.perform(get("/api/v1/products/" + renamed))
                .andExpect(jsonPath("$.data.price").value(11500000));

        Integer audits = jdbc.queryForObject(
                "select count(*) from audit_logs where entity_type = 'product' and entity_id = ?", Integer.class, id);
        assertThat(audits).isEqualTo(3);
        String before = jdbc.queryForObject(
                "select before->>'price' from audit_logs where action = 'PRODUCT_UPDATE' and entity_id = ?",
                String.class,
                id);
        assertThat(before).isEqualTo("12000000");

        mvc.perform(delete("/api/v1/admin/products/" + id).header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/products/" + renamed)).andExpect(status().isNotFound());
    }

    @Test
    void productValidation() throws Exception {
        mvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("amd-epyc-7402", "DRAFT", 1L)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("SLUG_ALREADY_EXISTS"));

        String noVietnamese =
                productJson("no-vi-" + System.nanoTime(), "DRAFT", 1L).replace("\"vi\"", "\"en\"");
        mvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noVietnamese))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("translations.vi"));

        mvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("negative-" + System.nanoTime(), "DRAFT", -5L)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productJson("Bad Slug!", "DRAFT", 1L)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminListSearchesAllStatuses() throws Exception {
        mvc.perform(get("/api/v1/admin/products?q=7b13").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].slug").value("amd-epyc-7b13"));
        mvc.perform(get("/api/v1/admin/products?category=gpu").header("Authorization", admin.bearer()))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    // --- Images (ADM-03, SEC-11) ---------------------------------------------------------------------------------

    @Test
    void imageUploadCreatesWebpVariantsAndCanBeReorderedAndDeleted() throws Exception {
        // A product of its own: every seeded product has photos, and the catalog tests share this database.
        String slug = "image-test-" + System.nanoTime();
        String id = JsonPath.read(
                mvc.perform(post("/api/v1/admin/products")
                                .header("Authorization", admin.bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(productJson(slug, "PUBLISHED", 1_000_000L)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.data.id");

        MockMultipartFile png = new MockMultipartFile("file", "photo.png", "image/png", png(2000, 1000));
        String body = mvc.perform(multipart("/api/v1/admin/products/" + id + "/images")
                        .file(png)
                        .param("altVi", "Tản nhiệt AIO 360")
                        .param("credit", "Ảnh: Bee Store")
                        .header("Authorization", admin.bearer()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.width").value(2000))
                .andExpect(jsonPath("$.data.url", endsWith("-1600.webp")))
                .andExpect(jsonPath("$.data.thumbnailUrl", endsWith("-320.webp")))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String firstImage = JsonPath.read(body, "$.data.id");
        String path = URI.create(JsonPath.<String>read(body, "$.data.url")).getPath();
        mvc.perform(get(path)).andExpect(status().isOk()).andExpect(content().contentType("image/webp"));
        mvc.perform(get(path.replace("-1600.webp", "-800.webp"))).andExpect(status().isOk());

        // Public catalog now shows the photo with its alt text.
        mvc.perform(get("/api/v1/products/" + slug))
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.images[0].alt").value("Tản nhiệt AIO 360"))
                .andExpect(jsonPath("$.data.imageCredits").value("Ảnh: Bee Store"));

        String second = JsonPath.read(
                mvc.perform(multipart("/api/v1/admin/products/" + id + "/images")
                                .file(new MockMultipartFile("file", "b.png", "image/png", png(400, 300)))
                                .header("Authorization", admin.bearer()))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.data.id");
        mvc.perform(patch("/api/v1/admin/products/" + id + "/images/" + second)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"primary\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.images[0].id").value(second))
                .andExpect(jsonPath("$.data.images[1].id").value(firstImage));

        mvc.perform(delete("/api/v1/admin/products/" + id + "/images/" + firstImage)
                        .header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get(path)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/admin/products/" + id + "/images/" + second)
                        .header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/admin/products/" + id).header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());
    }

    @Test
    void uploadRejectsFilesThatAreNotImages() throws Exception {
        String id = jdbc.queryForObject("select id::text from products where slug = 'cooler-m97'", String.class);
        MockMultipartFile fake =
                new MockMultipartFile("file", "evil.png", "image/png", "<script>alert(1)</script>".getBytes());
        mvc.perform(multipart("/api/v1/admin/products/" + id + "/images")
                        .file(fake)
                        .header("Authorization", admin.bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("file"));
    }

    // --- Categories (ADM-04) -------------------------------------------------------------------------------------

    @Test
    void categoryAndSubCategoryCrud() throws Exception {
        String slug = "ram-" + System.nanoTime();
        String body = mvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"%s\",\"name\":{\"vi\":\"RAM\",\"en\":\"Memory\"},\"sortOrder\":9}"
                                .formatted(slug)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = JsonPath.read(body, "$.data.id");

        mvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"cpu\",\"name\":{\"vi\":\"CPU\"},\"sortOrder\":0}"))
                .andExpect(status().isConflict());

        String withSub = mvc.perform(post("/api/v1/admin/categories/" + id + "/sub-categories")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"ddr4\",\"name\":{\"vi\":\"DDR4\"},\"sortOrder\":0}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.subCategories[0].slug").value("ddr4"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String subId = JsonPath.read(withSub, "$.data.subCategories[0].id");

        mvc.perform(put("/api/v1/admin/categories/" + id + "/sub-categories/" + subId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"ddr4-ecc\",\"name\":{\"vi\":\"DDR4 ECC\"},\"sortOrder\":1}"))
                .andExpect(jsonPath("$.data.subCategories[0].slug").value("ddr4-ecc"));
        mvc.perform(get("/api/v1/categories/" + slug + "?locale=en"))
                .andExpect(jsonPath("$.data.name").value("Memory"));

        mvc.perform(delete("/api/v1/admin/categories/" + id + "/sub-categories/" + subId)
                        .header("Authorization", admin.bearer()))
                .andExpect(jsonPath("$.data.subCategories", hasSize(0)));
        mvc.perform(delete("/api/v1/admin/categories/" + id).header("Authorization", admin.bearer()))
                .andExpect(status().isNoContent());

        String cpuId = jdbc.queryForObject("select id::text from categories where slug = 'cpu'", String.class);
        mvc.perform(delete("/api/v1/admin/categories/" + cpuId).header("Authorization", admin.bearer()))
                .andExpect(status().isBadRequest());
    }

    // --- Inquiries (ADM-05) --------------------------------------------------------------------------------------

    @Test
    void inquiryWorkflowWithAssignmentAndPrivateNotes() throws Exception {
        Session customer = AuthSupport.newCustomer(mvc, mails);
        String productId =
                jdbc.queryForObject("select id::text from products where slug = 'nvidia-tesla-a2'", String.class);
        String code = JsonPath.read(
                mvc.perform(post("/api/v1/inquiries")
                                .header("Authorization", customer.bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"productId\":\"%s\",\"quantity\":3,\"phone\":\"+84900000001\"}"
                                        .formatted(productId)))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(),
                "$.data.inquiryCode");
        String inquiryId = jdbc.queryForObject("select id::text from inquiries where code = ?", String.class, code);
        String adminId = jdbc.queryForObject("select id::text from users where email = ?", String.class, admin.email());

        mvc.perform(get("/api/v1/admin/inquiries?status=NEW&q=" + code).header("Authorization", admin.bearer()))
                .andExpect(jsonPath("$.data.content[0].code").value(code));

        mvc.perform(patch("/api/v1/admin/inquiries/" + inquiryId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONTACTED\",\"assigneeId\":\"%s\",\"note\":\"Đã gọi Zalo, chờ chốt\"}"
                                .formatted(adminId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONTACTED"))
                .andExpect(jsonPath("$.data.assigneeId").value(adminId))
                .andExpect(jsonPath("$.data.events[1].note").value("Đã gọi Zalo, chờ chốt"));

        String customerId =
                jdbc.queryForObject("select id::text from users where email = ?", String.class, customer.email());
        mvc.perform(patch("/api/v1/admin/inquiries/" + inquiryId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeId\":\"%s\"}".formatted(customerId)))
                .andExpect(status().isBadRequest());

        String mine = mvc.perform(get("/api/v1/me/inquiries").header("Authorization", customer.bearer()))
                .andExpect(jsonPath("$.data.content[0].status").value("CONTACTED"))
                .andExpect(jsonPath("$.data.content[0].history", hasSize(2)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(mine).doesNotContain("chờ chốt");
    }

    // --- Users (ADM-06) ------------------------------------------------------------------------------------------

    @Test
    void lockUnlockAndRoleChange() throws Exception {
        Session customer = AuthSupport.newCustomer(mvc, mails);
        String customerId =
                jdbc.queryForObject("select id::text from users where email = ?", String.class, customer.email());

        mvc.perform(get("/api/v1/admin/users?q=" + customer.email()).header("Authorization", admin.bearer()))
                .andExpect(jsonPath("$.data.content[0].id").value(customerId))
                .andExpect(jsonPath("$.data.content[0].passwordHash").doesNotExist());

        mvc.perform(patch("/api/v1/admin/users/" + customerId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOCKED\"}"))
                .andExpect(jsonPath("$.data.status").value("LOCKED"));
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(customer.email(), PASSWORD)))
                .andExpect(status().isLocked());
        mvc.perform(post("/api/v1/auth/refresh")
                        .header("X-Requested-With", "beestore")
                        .cookie(customer.refreshCookie()))
                .andExpect(status().isUnauthorized());

        mvc.perform(patch("/api/v1/admin/users/" + customerId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\",\"role\":\"ADMIN\"}"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
        Session promoted = AuthSupport.login(mvc, customer.email(), PASSWORD);
        mvc.perform(get("/api/v1/admin/users").header("Authorization", promoted.bearer()))
                .andExpect(status().isOk());

        String adminId = jdbc.queryForObject("select id::text from users where email = ?", String.class, admin.email());
        mvc.perform(patch("/api/v1/admin/users/" + adminId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOCKED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerificationForPendingUsers() throws Exception {
        String email = AuthSupport.uniqueEmail("pending");
        AuthSupport.register(mvc, email);
        String userId = jdbc.queryForObject("select id::text from users where email = ?", String.class, email);
        String first = mails.lastToken(email, "verify-email");

        mvc.perform(patch("/api/v1/admin/users/" + userId)
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resendVerification\":true}"))
                .andExpect(status().isOk());
        assertThat(mails.lastToken(email, "verify-email")).isNotEqualTo(first);
    }

    // --- Audit log (ADM-08) --------------------------------------------------------------------------------------

    @Test
    void auditLogIsListedNewestFirst() throws Exception {
        mvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", admin.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"audit-%d\",\"name\":{\"vi\":\"Audit\"},\"sortOrder\":50}"
                                .formatted(System.nanoTime())))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/admin/audit-logs?entityType=category").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].action").value("CATEGORY_CREATE"))
                .andExpect(jsonPath("$.data.content[0].actorId").isNotEmpty())
                .andExpect(jsonPath("$.data.content[0].after.slug").exists());
        // Leave the shared catalog as it was for the other test classes.
        jdbc.update("delete from categories where slug like 'audit-%'");
    }

    // --- helpers ---------------------------------------------------------------------------------------------------

    private static String productJson(String slug, String status, Long price) {
        return """
                {"slug":"%s","brand":"AMD","categorySlug":"cpu","subCategorySlug":"zen-3","price":%d,
                 "stockStatus":"PRE_ORDER","status":"%s","featured":false,
                 "translations":{"vi":{"name":"CPU thử nghiệm","shortDescription":"Mô tả ngắn","highlights":["64 nhân"]},
                                 "en":{"name":"Test CPU"}},
                 "specs":[{"key":"socket","label":{"vi":"Socket","en":"Socket"},"value":{"vi":"SP3","en":"SP3"}}],
                 "sources":["https://www.amd.com"]}
                """
                .formatted(slug, price, status);
    }

    private static byte[] png(int width, int height) throws Exception {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(0, 142, 204));
        g.fillRect(0, 0, width, height);
        g.setColor(Color.WHITE);
        g.fillOval(width / 4, height / 4, width / 2, height / 2);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }
}
