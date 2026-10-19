package vn.beestore.api.inquiry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Duration;
import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.AuthSupport.Session;
import vn.beestore.api.support.CatalogFixture;
import vn.beestore.api.support.IntegrationTest;

/** ENG-01..06: quote requests, contact form, "My inquiries" and wishlist. */
class EngagementIT extends IntegrationTest {

    @Autowired
    CatalogImporter importer;

    String productId;

    @BeforeEach
    void seed() {
        CatalogFixture.ensureImported(importer);
        productId = jdbc.queryForObject("select id::text from products where slug = 'amd-epyc-7b13'", String.class);
    }

    @Test
    void guestQuoteRequestStoresSnapshotAndNotifiesBothSides() throws Exception {
        String email = AuthSupport.uniqueEmail("guest");
        String body = mvc.perform(post("/api/v1/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {"productId":"%s","quantity":2,"message":"Cần 2 con cho server ảo hoá",
                                 "preferredContact":"ZALO","phone":"+84901234567","fullName":"Khách A",
                                 "email":"%s","captchaToken":"dev"}
                                """
                                        .formatted(productId, email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.inquiryCode", matchesPattern("INQ-\\d{4}-\\d{6}")))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String code = JsonPath.read(body, "$.data.inquiryCode");

        var row = jdbc.queryForMap(
                "select status, type, quantity, product_snapshot::text as snap, user_id from inquiries where code = ?",
                code);
        assertThat(row.get("status")).isEqualTo("NEW");
        assertThat(row.get("type")).isEqualTo("PRODUCT");
        assertThat(row.get("quantity")).isEqualTo(2);
        assertThat(row.get("snap").toString()).contains("AMD EPYC 7B13").contains("18824000");
        assertThat(row.get("user_id")).isNull();

        assertThat(mails.to(email)).anyMatch(m -> m.template().equals("inquiry-confirmation"));
        assertThat(mails.to("sales@beestore.vn")).anyMatch(m -> m.template().equals("inquiry-sales"));
        await().atMost(Duration.ofSeconds(10))
                .until(() -> Arrays.stream(GREEN_MAIL.getReceivedMessages()).anyMatch(m -> {
                    try {
                        return m.getSubject().contains(code);
                    } catch (Exception e) {
                        return false;
                    }
                }));
    }

    @Test
    void guestsMustGiveNameEmailAndPhone() throws Exception {
        mvc.perform(post("/api/v1/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {"productId":"%s","quantity":1,"fullName":"Khách B","email":"%s"}
                                """
                                        .formatted(productId, AuthSupport.uniqueEmail("nophone"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("phone"));
        mvc.perform(post("/api/v1/inquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"%s\",\"quantity\":0}".formatted(productId)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownOrUnpublishedProductIsNotFound() throws Exception {
        mvc.perform(
                        post("/api/v1/inquiries")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"productId":"00000000-0000-0000-0000-000000000000","quantity":1,
                                 "fullName":"A","email":"a@example.com","phone":"+84901234567"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void loggedInInquiryUsesProfileAndShowsInMyInquiries() throws Exception {
        Session s = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/inquiries")
                        .header("Authorization", s.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"%s\",\"quantity\":1,\"phone\":\"+84987654321\"}"
                                .formatted(productId)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/me/inquiries").header("Authorization", s.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].status").value("NEW"))
                .andExpect(jsonPath("$.data.content[0].product.slug").value("amd-epyc-7b13"))
                .andExpect(jsonPath("$.data.content[0].history", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].history[0].toStatus").value("NEW"));

        String storedEmail = jdbc.queryForObject(
                "select i.email from inquiries i join users u on u.id = i.user_id where u.email = ?",
                String.class,
                s.email());
        assertThat(storedEmail).isEqualTo(s.email());

        mvc.perform(get("/api/v1/me/inquiries")).andExpect(status().isUnauthorized());
    }

    @Test
    void contactFormCreatesAGeneralInquiry() throws Exception {
        String body = mvc.perform(post("/api/v1/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {"fullName":"Khách C","email":"%s","phone":"+84911111111",
                                 "subject":"Tư vấn build home lab","message":"Nhờ tư vấn cấu hình 2P"}
                                """
                                        .formatted(AuthSupport.uniqueEmail("contact"))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String code = JsonPath.read(body, "$.data.inquiryCode");
        assertThat(jdbc.queryForObject("select type from inquiries where code = ?", String.class, code))
                .isEqualTo("GENERAL");

        mvc.perform(post("/api/v1/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"A\",\"email\":\"a@example.com\",\"phone\":\"+84911111111\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void wishlistAddListRemove() throws Exception {
        Session s = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/me/wishlist/" + productId).header("Authorization", s.bearer()))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/me/wishlist/" + productId).header("Authorization", s.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/me/wishlist").header("Authorization", s.bearer()))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].slug").value("amd-epyc-7b13"));
        mvc.perform(delete("/api/v1/me/wishlist/" + productId).header("Authorization", s.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/me/wishlist").header("Authorization", s.bearer()))
                .andExpect(jsonPath("$.data", hasSize(0)));

        mvc.perform(post("/api/v1/me/wishlist/00000000-0000-0000-0000-000000000000")
                        .header("Authorization", s.bearer()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/me/wishlist")).andExpect(status().isUnauthorized());
    }
}
