package vn.beestore.api.catalog.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.catalog.domain.StockStatus;
import vn.beestore.api.catalog.dto.CatalogDtos.CategoryDto;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductDetailDto;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductSummaryDto;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.catalog.service.CatalogService;
import vn.beestore.api.catalog.service.CatalogService.ProductQuery;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.web.ClientInfo;

/** Public catalog endpoints (README §8.3 "Catalog"); payloads follow §8.4. */
@RestController
@RequestMapping("/api/v1")
@Validated
public class CatalogController {

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categories")
    ApiResponse<List<CategoryDto>> categories(@RequestParam(required = false) String locale) {
        return ApiResponse.ok(catalog.listCategories(CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/categories/{slug}")
    ApiResponse<CategoryDto> category(@PathVariable String slug, @RequestParam(required = false) String locale) {
        return ApiResponse.ok(catalog.getCategory(slug, CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/products")
    ApiResponse<PaginatedResponse<ProductSummaryDto>> products(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sub,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) @Min(0) Long minPrice,
            @RequestParam(required = false) @Min(0) Long maxPrice,
            @RequestParam(required = false) StockStatus stock,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @Pattern(regexp = "featured|price-asc|price-desc|newest") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(CatalogService.MAX_PAGE_SIZE) int size,
            @RequestParam(required = false) String locale) {
        ProductQuery query = new ProductQuery(category, sub, brand, minPrice, maxPrice, stock, q, sort, page, size);
        return ApiResponse.ok(catalog.listProducts(query, CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/products/featured")
    ApiResponse<List<ProductSummaryDto>> featured(@RequestParam(required = false) String locale) {
        return ApiResponse.ok(catalog.featured(CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/products/suggestions")
    ApiResponse<List<ProductSummaryDto>> suggestions(
            @RequestParam(defaultValue = "") String q, @RequestParam(required = false) String locale) {
        return ApiResponse.ok(catalog.suggestions(q, CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/products/{slug}")
    ApiResponse<ProductDetailDto> product(@PathVariable String slug, @RequestParam(required = false) String locale) {
        return ApiResponse.ok(catalog.getProduct(slug, CatalogMapper.normalizeLocale(locale)));
    }

    @GetMapping("/products/{slug}/related")
    ApiResponse<List<ProductSummaryDto>> related(
            @PathVariable String slug,
            @RequestParam(required = false) String locale,
            @RequestParam(defaultValue = "4") @Min(1) @Max(12) int limit) {
        return ApiResponse.ok(catalog.related(slug, CatalogMapper.normalizeLocale(locale), limit));
    }

    @PostMapping("/products/{id}/views")
    ResponseEntity<Void> view(@PathVariable UUID id, HttpServletRequest http) {
        catalog.recordView(id, ClientInfo.from(http).ip());
        return ResponseEntity.noContent().build();
    }
}
