package vn.beestore.api.catalog.service;

import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.StockStatus;
import vn.beestore.api.catalog.dto.CatalogDtos.CategoryDto;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductDetailDto;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductSummaryDto;
import vn.beestore.api.catalog.dto.CatalogDtos.SubCategoryDto;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.repository.ProductSearchRepository;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.ratelimit.RateLimitPolicy;
import vn.beestore.api.common.ratelimit.RateLimiter;

/** Public, read-only catalog: only {@code PUBLISHED} products are visible (CAT-02..09). */
@Service
@Transactional(readOnly = true)
public class CatalogService {

    public static final int DEFAULT_PAGE_SIZE = 12;
    public static final int MAX_PAGE_SIZE = 48;
    static final int SUGGESTION_LIMIT = 8;
    static final int FEATURED_LIMIT = 8;
    static final int SEARCH_CANDIDATES = 500;

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ProductSearchRepository search;
    private final CatalogMapper mapper;
    private final RateLimiter rateLimiter;

    public CatalogService(
            CategoryRepository categories,
            ProductRepository products,
            ProductSearchRepository search,
            CatalogMapper mapper,
            RateLimiter rateLimiter) {
        this.categories = categories;
        this.products = products;
        this.search = search;
        this.mapper = mapper;
        this.rateLimiter = rateLimiter;
    }

    public record ProductQuery(
            String category,
            String sub,
            String brand,
            Long minPrice,
            Long maxPrice,
            StockStatus stock,
            String q,
            String sort,
            int page,
            int size) {}

    public List<CategoryDto> listCategories(String locale) {
        Counts counts = counts();
        return categories.findAllByOrderBySortOrderAscSlugAsc().stream()
                .map(c -> toDto(c, locale, counts))
                .toList();
    }

    public CategoryDto getCategory(String slug, String locale) {
        Category category = categories.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Category"));
        return toDto(category, locale, counts());
    }

    public PaginatedResponse<ProductSummaryDto> listProducts(ProductQuery query, String locale) {
        int size = Math.min(Math.max(query.size() <= 0 ? DEFAULT_PAGE_SIZE : query.size(), 1), MAX_PAGE_SIZE);
        int page = Math.max(query.page(), 0);
        Specification<Product> spec = published();

        if (notBlank(query.category())) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("category").get("slug"), query.category()));
        }
        if (notBlank(query.sub())) {
            spec = spec.and((root, cq, cb) ->
                    cb.equal(root.join("subCategory", JoinType.LEFT).get("slug"), query.sub()));
        }
        if (notBlank(query.brand())) {
            spec = spec.and((root, cq, cb) ->
                    cb.equal(cb.lower(root.get("brand")), query.brand().toLowerCase()));
        }
        if (query.stock() != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("stockStatus"), query.stock()));
        }
        if (query.minPrice() != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("price"), query.minPrice()));
        }
        if (query.maxPrice() != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("price"), query.maxPrice()));
        }

        List<UUID> matches = null;
        if (notBlank(query.q())) {
            matches = search.search(query.q(), SEARCH_CANDIDATES);
            if (matches.isEmpty()) {
                return new PaginatedResponse<>(List.of(), page, size, 0, 0, true);
            }
            List<UUID> ids = matches;
            spec = spec.and((root, cq, cb) -> root.get("id").in(ids));
        }

        Sort sort = sort(query.sort());
        if ("price-asc".equals(query.sort()) || "price-desc".equals(query.sort())) {
            spec = spec.and(priceOrder("price-asc".equals(query.sort())));
            sort = Sort.unsorted();
        }
        Page<Product> result = products.findAll(spec, PageRequest.of(page, size, sort));
        return PaginatedResponse.of(result, p -> mapper.toSummary(p, locale));
    }

    /** Featured products; until any is flagged, the newest products with photos (README §2.3 data has no flags). */
    public List<ProductSummaryDto> featured(String locale) {
        Specification<Product> flagged = published().and((root, cq, cb) -> cb.isTrue(root.get("featured")));
        List<Product> list = products.findAll(flagged, PageRequest.of(0, FEATURED_LIMIT, defaultSort()))
                .getContent();
        if (list.isEmpty()) {
            Specification<Product> withImages = published().and((root, cq, cb) -> cb.isNotEmpty(root.get("images")));
            list = products.findAll(withImages, PageRequest.of(0, FEATURED_LIMIT, defaultSort()))
                    .getContent();
        }
        return list.stream().map(p -> mapper.toSummary(p, locale)).toList();
    }

    public ProductDetailDto getProduct(String slug, String locale) {
        return mapper.toDetail(publishedBySlug(slug), locale);
    }

    /** Same sub-category first, then same category, at most {@code limit} (CAT-09). */
    public List<ProductSummaryDto> related(String slug, String locale, int limit) {
        Product current = publishedBySlug(slug);
        UUID categoryId = current.getCategory().getId();
        UUID subId = current.getSubCategory() == null
                ? null
                : current.getSubCategory().getId();
        List<Product> candidates = products.findAll(
                published()
                        .and((root, cq, cb) -> cb.equal(root.get("category").get("id"), categoryId))
                        .and((root, cq, cb) -> cb.notEqual(root.get("id"), current.getId())),
                defaultSort());
        List<Product> ordered = new ArrayList<>();
        candidates.stream()
                .filter(p -> subId != null
                        && p.getSubCategory() != null
                        && subId.equals(p.getSubCategory().getId()))
                .forEach(ordered::add);
        candidates.stream().filter(p -> !ordered.contains(p)).forEach(ordered::add);
        return ordered.stream()
                .limit(Math.min(Math.max(limit, 1), 12))
                .map(p -> mapper.toSummary(p, locale))
                .toList();
    }

    public List<ProductSummaryDto> suggestions(String q, String locale) {
        if (!notBlank(q)) {
            return List.of();
        }
        List<UUID> ids = search.search(q, SUGGESTION_LIMIT);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<UUID, Product> byId = products
                .findAll(published().and((root, cq, cb) -> root.get("id").in(ids)))
                .stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        return ids.stream()
                .map(byId::get)
                .filter(java.util.Objects::nonNull)
                .map(p -> mapper.toSummary(p, locale))
                .toList();
    }

    /** Counts a product view, at most once per product and IP every 30 minutes (README §6.5). */
    @Transactional
    public void recordView(UUID productId, String ip) {
        try {
            rateLimiter.check(RateLimitPolicy.PRODUCT_VIEW, ip + ":" + productId);
        } catch (ApiException duplicate) {
            return;
        }
        products.incrementViews(productId, ProductStatus.PUBLISHED);
    }

    private Product publishedBySlug(String slug) {
        return products.findBySlugAndStatus(slug, ProductStatus.PUBLISHED)
                .orElseThrow(() -> ApiException.notFound("Product"));
    }

    private static Specification<Product> published() {
        return (root, cq, cb) -> cb.equal(root.get("status"), ProductStatus.PUBLISHED);
    }

    static Sort sort(String sort) {
        if ("newest".equals(sort)) {
            return Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("slug"));
        }
        return defaultSort();
    }

    /**
     * Price ordering with "contact for price" ({@code null}) products always last. Criteria queries cannot express
     * NULLS LAST, so the ordering is added to the query itself (skipped for the count query).
     */
    private static Specification<Product> priceOrder(boolean ascending) {
        return (root, cq, cb) -> {
            if (!Long.class.equals(cq.getResultType()) && !long.class.equals(cq.getResultType())) {
                var price = root.<Long>get("price");
                var nullsLast = cb.selectCase().when(cb.isNull(price), 1).otherwise(0);
                cq.orderBy(cb.asc(nullsLast), ascending ? cb.asc(price) : cb.desc(price), cb.asc(root.get("slug")));
            }
            return cb.conjunction();
        };
    }

    private static Sort defaultSort() {
        return Sort.by(
                Sort.Order.desc("featured"),
                Sort.Order.asc("category.sortOrder"),
                Sort.Order.asc("createdAt"),
                Sort.Order.asc("slug"));
    }

    private CategoryDto toDto(Category c, String locale, Counts counts) {
        List<SubCategoryDto> subs = c.getSubCategories().stream()
                .map(s -> new SubCategoryDto(
                        s.getSlug(), CatalogMapper.pick(s.getName(), locale), counts.bySub.getOrDefault(s.getId(), 0L)))
                .toList();
        return new CategoryDto(
                c.getId().toString(),
                c.getSlug(),
                CatalogMapper.pick(c.getName(), locale),
                mapper.categoryImageUrl(c),
                counts.byCategory.getOrDefault(c.getId(), 0L),
                subs);
    }

    private Counts counts() {
        Counts counts = new Counts();
        for (Object[] row : products.countByCategoryAndSubCategory(ProductStatus.PUBLISHED)) {
            UUID categoryId = (UUID) row[0];
            UUID subId = (UUID) row[1];
            long n = (Long) row[2];
            counts.byCategory.merge(categoryId, n, Long::sum);
            if (subId != null) {
                counts.bySub.merge(subId, n, Long::sum);
            }
        }
        return counts;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static final class Counts {
        final Map<UUID, Long> byCategory = new HashMap<>();
        final Map<UUID, Long> bySub = new HashMap<>();
    }
}
