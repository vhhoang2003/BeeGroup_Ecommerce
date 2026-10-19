package vn.beestore.api.admin.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.admin.dto.AdminDtos.AdminCategoryDto;
import vn.beestore.api.admin.dto.AdminDtos.CategoryRequest;
import vn.beestore.api.admin.dto.AdminDtos.SubCategoryRequest;
import vn.beestore.api.admin.service.AdminCategoryService;
import vn.beestore.api.common.api.ApiResponse;

/** {@code /api/v1/admin/categories} and their sub-categories (ADM-04). */
@RestController
@RequestMapping("/api/v1/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCategoryService categories;

    public AdminCategoryController(AdminCategoryService categories) {
        this.categories = categories;
    }

    @GetMapping
    ApiResponse<List<AdminCategoryDto>> list() {
        return ApiResponse.ok(categories.list());
    }

    @PostMapping
    ResponseEntity<ApiResponse<AdminCategoryDto>> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(categories.create(req)));
    }

    @PutMapping("/{id}")
    ApiResponse<AdminCategoryDto> update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest req) {
        return ApiResponse.ok(categories.update(id, req));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        categories.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sub-categories")
    ResponseEntity<ApiResponse<AdminCategoryDto>> addSub(
            @PathVariable UUID id, @Valid @RequestBody SubCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(categories.addSubCategory(id, req)));
    }

    @PutMapping("/{id}/sub-categories/{subId}")
    ApiResponse<AdminCategoryDto> updateSub(
            @PathVariable UUID id, @PathVariable UUID subId, @Valid @RequestBody SubCategoryRequest req) {
        return ApiResponse.ok(categories.updateSubCategory(id, subId, req));
    }

    @DeleteMapping("/{id}/sub-categories/{subId}")
    ApiResponse<AdminCategoryDto> deleteSub(@PathVariable UUID id, @PathVariable UUID subId) {
        return ApiResponse.ok(categories.deleteSubCategory(id, subId));
    }
}
