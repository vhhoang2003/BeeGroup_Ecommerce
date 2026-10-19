package vn.beestore.api.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.catalog.importer.ImportReport;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.CatalogFixture;
import vn.beestore.api.support.IntegrationTest;

/** CAT-02..09, ADM-07 importer and the README §8.4 DTO contract, against the real seed data. */
class CatalogIT extends IntegrationTest {

    @Autowired
    CatalogImporter importer;

    @Autowired
    ObjectMapper json;

    @Autowired
    PasswordEncoder passwordEncoder;

    @BeforeEach
    void seed() {
        ImportReport report = CatalogFixture.ensureImported(importer);
        assertThat(report.errors()).isEmpty();
    }

    // --- Importer (ADM-07, README §6.8) -------------------------------------------------------------------------

    @Test
    void importIsIdempotent() {
        ImportReport again = importer.importFrom(CatalogFixture.SEED);
        assertThat(again.errors()).isEmpty();
        assertThat(again.productsCreated()).isZero();
        assertThat(again.productsUpdated()).isZero();
        assertThat(again.productsSkipped()).isEqualTo(20);
        assertThat(again.categoriesCreated()).isZero();

        assertThat(jdbc.queryForObject("select count(*) from products", Integer.class))
                .isEqualTo(20);
        assertThat(jdbc.queryForObject("select count(*) from categories", Integer.class))
                .isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from product_translations", Integer.class))
                .isEqualTo(60);
    }

    @Test
    void importedImagesAreServedFromStorage() throws Exception {
        mvc.perform(get("/uploads/catalog/cpu/amd-epyc-7402/01-top.jpg"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"));
        mvc.perform(get("/uploads/../application.yml")).andExpect(status().is4xxClientError());
    }

    @Test
    void importEndpointIsAdminOnly() throws Exception {
        AuthSupport.Session customer = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/admin/import").header("Authorization", customer.bearer()))
                .andExpect(status().isForbidden());

        AuthSupport.Session admin = AuthSupport.newAdmin(mvc, jdbc, passwordEncoder.encode(AuthSupport.PASSWORD));
        mvc.perform(post("/api/v1/admin/import").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.productsSkipped").value(20))
                .andExpect(jsonPath("$.data.errors").isEmpty());
        assertThat(jdbc.queryForObject(
                        "select count(*) from audit_logs where action = 'CATALOG_IMPORT'", Integer.class))
                .isPositive();
    }

    // --- Categories (CAT-02) ------------------------------------------------------------------------------------

    @Test
    void categoriesComeInMenuOrderWithCounts() throws Exception {
        mvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].slug", contains("cpu", "gpu", "mainboard", "cooler")))
                .andExpect(jsonPath("$.data[0].itemCount").value(11))
                .andExpect(jsonPath("$.data[0].subCategories[*].slug", contains("zen-2", "zen-3")))
                .andExpect(jsonPath("$.data[0].subCategories[0].itemCount").value(7))
                .andExpect(jsonPath("$.data[0].subCategories[1].itemCount").value(4))
                .andExpect(jsonPath("$.data[0].image", startsWith("http://localhost:8080/uploads/catalog/cpu/")))
                .andExpect(jsonPath("$.data[3].itemCount").value(5));

        mvc.perform(get("/api/v1/categories/mainboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Mainboard"))
                .andExpect(jsonPath("$.data.subCategories[*].slug", contains("gigabyte", "huananzhi")));
        mvc.perform(get("/api/v1/categories/phones"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    // --- Listing, filters, sorting, paging (CAT-03) -------------------------------------------------------------

    @Test
    void listingPagesTwelveByDefault() throws Exception {
        mvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(12)))
                .andExpect(jsonPath("$.data.pageNumber").value(0))
                .andExpect(jsonPath("$.data.pageSize").value(12))
                .andExpect(jsonPath("$.data.totalElements").value(20))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.last").value(false));
        mvc.perform(get("/api/v1/products?page=1"))
                .andExpect(jsonPath("$.data.content", hasSize(8)))
                .andExpect(jsonPath("$.data.last").value(true));
        mvc.perform(get("/api/v1/products?size=49")).andExpect(status().isBadRequest());
    }

    @Test
    void filtersBySubCategoryBrandAndPrice() throws Exception {
        mvc.perform(get("/api/v1/products?category=cpu&sub=zen-3&sort=price-desc"))
                .andExpect(jsonPath("$.data.totalElements").value(4))
                .andExpect(jsonPath("$.data.content[0].slug").value("amd-epyc-7v73x"))
                .andExpect(jsonPath("$.data.content[0].price").value(39000000));
        mvc.perform(get("/api/v1/products?brand=amd"))
                .andExpect(jsonPath("$.data.totalElements").value(11));
        mvc.perform(get("/api/v1/products?category=cooler&maxPrice=2000000"))
                .andExpect(jsonPath("$.data.content[*].price", everyItem(lessThanOrEqualTo(2000000))));
        mvc.perform(get("/api/v1/products?stock=OUT_OF_STOCK"))
                .andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/api/v1/products?category=cpu&sort=price-asc&size=1"))
                .andExpect(jsonPath("$.data.content[0].slug").value("amd-epyc-7402"));
        mvc.perform(get("/api/v1/products?sort=random")).andExpect(status().isBadRequest());
    }

    // --- Search (CAT-04) ----------------------------------------------------------------------------------------

    @Test
    void searchMatchesPrefixesSpecsAndTypos() throws Exception {
        mvc.perform(get("/api/v1/products/suggestions?q=7B1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].slug", hasItems("amd-epyc-7b12", "amd-epyc-7b13")))
                .andExpect(jsonPath("$.data", hasSize(lessThanOrEqualTo(8))));
        mvc.perform(get("/api/v1/products?q=24 core"))
                .andExpect(jsonPath("$.data.content[*].slug", hasItems("amd-epyc-7402")));
        mvc.perform(get("/api/v1/products?q=huananzi"))
                .andExpect(jsonPath("$.data.content[*].slug", hasItems("huananzhi-h12d-8d-1p")));
        mvc.perform(get("/api/v1/products?q=zzzzqqq"))
                .andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/api/v1/products/suggestions?q=")).andExpect(jsonPath("$.data", hasSize(0)));
    }

    // --- Detail, locale, related, featured (CAT-05..09) ---------------------------------------------------------

    @Test
    void detailIsLocalizedWithImagesAndCredits() throws Exception {
        mvc.perform(get("/api/v1/products/amd-epyc-7402"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("AMD EPYC 7402"))
                .andExpect(jsonPath("$.data.price").value(3380000))
                .andExpect(jsonPath("$.data.stockStatus").value("IN_STOCK"))
                .andExpect(jsonPath("$.data.category.slug").value("cpu"))
                .andExpect(jsonPath("$.data.subCategory.slug").value("zen-2"))
                .andExpect(jsonPath("$.data.specs[0].label").value("Thương hiệu"))
                .andExpect(jsonPath("$.data.images", hasSize(4)))
                .andExpect(jsonPath(
                        "$.data.images[0].url",
                        startsWith("http://localhost:8080/uploads/catalog/cpu/amd-epyc-7402/01-top.jpg")))
                .andExpect(jsonPath("$.data.imageCredits", containsString("Free Art License")))
                .andExpect(jsonPath("$.data.sources[0]", startsWith("https://www.amd.com")));

        mvc.perform(get("/api/v1/products/amd-epyc-7402?locale=en"))
                .andExpect(jsonPath("$.data.specs[0].label").value("Brand"))
                .andExpect(jsonPath("$.data.useCases[0]").value("Home lab"));
        mvc.perform(get("/api/v1/products/amd-epyc-7402?locale=fr"))
                .andExpect(jsonPath("$.data.specs[0].label").value("Thương hiệu"));
        mvc.perform(get("/api/v1/products/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void relatedPrefersTheSameSubCategory() throws Exception {
        mvc.perform(get("/api/v1/products/amd-epyc-7402/related"))
                .andExpect(jsonPath("$.data", hasSize(4)))
                .andExpect(jsonPath("$.data[*].subCategory.slug", everyItem(org.hamcrest.Matchers.is("zen-2"))));
    }

    @Test
    void featuredFallsBackToProductsWithPhotos() throws Exception {
        mvc.perform(get("/api/v1/products/featured"))
                .andExpect(jsonPath("$.data", hasSize(8)))
                .andExpect(jsonPath("$.data[*].image.url", everyItem(startsWith("http://localhost:8080/uploads/"))));
    }

    @Test
    void draftProductsAreHidden() throws Exception {
        jdbc.update("update products set status = 'DRAFT' where slug = 'cooler-m97'");
        try {
            mvc.perform(get("/api/v1/products/cooler-m97")).andExpect(status().isNotFound());
            mvc.perform(get("/api/v1/products?category=cooler"))
                    .andExpect(jsonPath("$.data.totalElements").value(4));
            mvc.perform(get("/api/v1/categories/cooler"))
                    .andExpect(jsonPath("$.data.itemCount").value(4));
        } finally {
            jdbc.update("update products set status = 'PUBLISHED' where slug = 'cooler-m97'");
        }
    }

    @Test
    void viewsAreCounted() throws Exception {
        String id = jdbc.queryForObject("select id::text from products where slug = 'nvidia-tesla-a2'", String.class);
        Long before = jdbc.queryForObject("select view_count from products where id = ?::uuid", Long.class, id);
        mvc.perform(post("/api/v1/products/" + id + "/views")).andExpect(status().isNoContent());
        Long after = jdbc.queryForObject("select view_count from products where id = ?::uuid", Long.class, id);
        assertThat(after).isEqualTo(before + 1);
    }

    // --- DTO contract (README §8.4) -----------------------------------------------------------------------------

    @Test
    void summaryAndDetailMatchTheFrontendTypes() throws Exception {
        String list = mvc.perform(get("/api/v1/products?size=1"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode summary = json.readTree(list).at("/data/content/0");
        assertThat(fieldNames(summary))
                .containsExactlyInAnyOrder(
                        "id",
                        "slug",
                        "name",
                        "brand",
                        "category",
                        "subCategory",
                        "price",
                        "stockStatus",
                        "featured",
                        "shortDescription",
                        "image");

        String detail = mvc.perform(get("/api/v1/products/amd-epyc-7402"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(fieldNames(json.readTree(detail).at("/data")))
                .containsAll(fieldNames(summary))
                .contains(
                        "description", "highlights", "useCases", "notes", "specs", "images", "sources", "imageCredits");

        String categories =
                mvc.perform(get("/api/v1/categories")).andReturn().getResponse().getContentAsString();
        assertThat(fieldNames(json.readTree(categories).at("/data/0")))
                .containsExactlyInAnyOrder("id", "slug", "name", "image", "itemCount", "subCategories");
    }

    private static Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
