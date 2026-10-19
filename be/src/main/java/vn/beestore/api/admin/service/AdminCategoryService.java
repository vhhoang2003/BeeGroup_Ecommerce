package vn.beestore.api.admin.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.admin.dto.AdminDtos.AdminCategoryDto;
import vn.beestore.api.admin.dto.AdminDtos.AdminSubCategoryDto;
import vn.beestore.api.admin.dto.AdminDtos.CategoryRequest;
import vn.beestore.api.admin.dto.AdminDtos.SubCategoryRequest;
import vn.beestore.api.admin.service.RevalidationNotifier.ContentChanged;
import vn.beestore.api.catalog.domain.Category;
import vn.beestore.api.catalog.domain.SubCategory;
import vn.beestore.api.catalog.repository.CategoryRepository;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/** Category and sub-category CRUD with ordering (ADM-04). */
@Service
public class AdminCategoryService {

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public AdminCategoryService(
            CategoryRepository categories,
            ProductRepository products,
            AuditService audit,
            ApplicationEventPublisher events) {
        this.categories = categories;
        this.products = products;
        this.audit = audit;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryDto> list() {
        return categories.findAllByOrderBySortOrderAscSlugAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AdminCategoryDto create(CategoryRequest req) {
        if (categories.existsBySlug(req.slug())) {
            throw new ApiException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already exists");
        }
        Category category = new Category();
        apply(category, req);
        categories.saveAndFlush(category);
        AdminCategoryDto dto = toDto(category);
        audit.record("CATEGORY_CREATE", "category", category.getId(), null, dto);
        changed(category.getSlug());
        return dto;
    }

    @Transactional
    public AdminCategoryDto update(UUID id, CategoryRequest req) {
        Category category = find(id);
        AdminCategoryDto before = toDto(category);
        if (!category.getSlug().equals(req.slug()) && categories.existsBySlug(req.slug())) {
            throw new ApiException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already exists");
        }
        String oldSlug = category.getSlug();
        apply(category, req);
        categories.flush();
        AdminCategoryDto after = toDto(category);
        audit.record("CATEGORY_UPDATE", "category", id, before, after);
        changed(oldSlug, category.getSlug());
        return after;
    }

    /** Only empty categories can be deleted. */
    @Transactional
    public void delete(UUID id) {
        Category category = find(id);
        if (products.countByCategoryId(id) > 0) {
            throw ApiException.validation("category", "Category still has products");
        }
        AdminCategoryDto before = toDto(category);
        categories.delete(category);
        audit.record("CATEGORY_DELETE", "category", id, before, null);
        changed(category.getSlug());
    }

    @Transactional
    public AdminCategoryDto addSubCategory(UUID categoryId, SubCategoryRequest req) {
        Category category = find(categoryId);
        if (category.getSubCategories().stream().anyMatch(s -> s.getSlug().equals(req.slug()))) {
            throw new ApiException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already exists in this category");
        }
        SubCategory sub = new SubCategory();
        sub.setCategory(category);
        apply(sub, req);
        category.getSubCategories().add(sub);
        categories.flush();
        audit.record("SUB_CATEGORY_CREATE", "sub_category", sub.getId(), null, toSubDto(sub));
        changed(category.getSlug());
        return toDto(category);
    }

    @Transactional
    public AdminCategoryDto updateSubCategory(UUID categoryId, UUID subId, SubCategoryRequest req) {
        Category category = find(categoryId);
        SubCategory sub = findSub(category, subId);
        AdminSubCategoryDto before = toSubDto(sub);
        if (!sub.getSlug().equals(req.slug())
                && category.getSubCategories().stream()
                        .anyMatch(s -> s.getSlug().equals(req.slug()))) {
            throw new ApiException(ErrorCode.SLUG_ALREADY_EXISTS, "Slug already exists in this category");
        }
        apply(sub, req);
        categories.flush();
        audit.record("SUB_CATEGORY_UPDATE", "sub_category", subId, before, toSubDto(sub));
        changed(category.getSlug());
        return toDto(category);
    }

    @Transactional
    public AdminCategoryDto deleteSubCategory(UUID categoryId, UUID subId) {
        Category category = find(categoryId);
        SubCategory sub = findSub(category, subId);
        if (products.countBySubCategoryId(subId) > 0) {
            throw ApiException.validation("subCategory", "Sub-category still has products");
        }
        AdminSubCategoryDto before = toSubDto(sub);
        category.getSubCategories().remove(sub);
        categories.flush();
        audit.record("SUB_CATEGORY_DELETE", "sub_category", subId, before, null);
        changed(category.getSlug());
        return toDto(category);
    }

    private Category find(UUID id) {
        return categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
    }

    private static SubCategory findSub(Category category, UUID subId) {
        return category.getSubCategories().stream()
                .filter(s -> s.getId().equals(subId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Sub-category"));
    }

    private static void apply(Category category, CategoryRequest req) {
        requireVietnamese(req.name());
        category.setSlug(req.slug());
        category.setName(new LinkedHashMap<>(req.name()));
        category.setImageUrl(req.imageUrl() == null || req.imageUrl().isBlank() ? null : req.imageUrl());
        category.setSortOrder(req.sortOrder());
    }

    private static void apply(SubCategory sub, SubCategoryRequest req) {
        requireVietnamese(req.name());
        sub.setSlug(req.slug());
        sub.setName(new LinkedHashMap<>(req.name()));
        sub.setSortOrder(req.sortOrder());
    }

    private static void requireVietnamese(Map<String, String> name) {
        if (!name.containsKey(CatalogMapper.DEFAULT_LOCALE)) {
            throw ApiException.validation("name.vi", "Vietnamese name is required");
        }
        for (String locale : name.keySet()) {
            if (!CatalogMapper.LOCALES.contains(locale)) {
                throw ApiException.validation("name", "Unsupported locale: " + locale);
            }
        }
    }

    private void changed(String... slugs) {
        List<String> paths = new java.util.ArrayList<>(List.of("/", "/products"));
        for (String slug : slugs) {
            paths.add("/category/" + slug);
        }
        events.publishEvent(new ContentChanged(paths.stream().distinct().toList()));
    }

    private AdminCategoryDto toDto(Category c) {
        return new AdminCategoryDto(
                c.getId(),
                c.getSlug(),
                c.getName(),
                c.getImageUrl(),
                c.getSortOrder(),
                c.getId() == null ? 0 : products.countByCategoryId(c.getId()),
                c.getSubCategories().stream().map(this::toSubDto).toList());
    }

    private AdminSubCategoryDto toSubDto(SubCategory s) {
        return new AdminSubCategoryDto(
                s.getId(),
                s.getSlug(),
                s.getName(),
                s.getSortOrder(),
                s.getId() == null ? 0 : products.countBySubCategoryId(s.getId()));
    }
}
