package vn.beestore.api.admin.controller;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.beestore.api.admin.dto.AdminDtos.AdminImageDto;
import vn.beestore.api.admin.dto.AdminDtos.AdminProductDto;
import vn.beestore.api.admin.dto.AdminDtos.AdminProductListItem;
import vn.beestore.api.admin.dto.AdminDtos.ImageUpdateRequest;
import vn.beestore.api.admin.dto.AdminDtos.ProductRequest;
import vn.beestore.api.admin.dto.AdminDtos.StatusRequest;
import vn.beestore.api.admin.service.AdminProductService;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.error.ApiException;

/** {@code /api/v1/admin/products} (ADM-02, ADM-03). */
@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminProductService products;

    public AdminProductController(AdminProductService products) {
        this.products = products;
    }

    @GetMapping
    ApiResponse<PaginatedResponse<AdminProductListItem>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(products.list(q, status, category, page, size));
    }

    @PostMapping
    ResponseEntity<ApiResponse<AdminProductDto>> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(products.create(req)));
    }

    @GetMapping("/{id}")
    ApiResponse<AdminProductDto> get(@PathVariable UUID id) {
        return ApiResponse.ok(products.get(id));
    }

    @PutMapping("/{id}")
    ApiResponse<AdminProductDto> update(@PathVariable UUID id, @Valid @RequestBody ProductRequest req) {
        return ApiResponse.ok(products.update(id, req));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        products.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    ApiResponse<AdminProductDto> status(@PathVariable UUID id, @Valid @RequestBody StatusRequest req) {
        return ApiResponse.ok(products.changeStatus(id, req.status()));
    }

    /** Multipart upload: {@code file} plus optional {@code altVi}, {@code altEn}, {@code altZh}, {@code credit}. */
    @PostMapping(path = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ApiResponse<AdminImageDto>> upload(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String altVi,
            @RequestParam(required = false) String altEn,
            @RequestParam(required = false) String altZh,
            @RequestParam(required = false) String credit) {
        Map<String, String> alt = new LinkedHashMap<>();
        putIfPresent(alt, "vi", altVi);
        putIfPresent(alt, "en", altEn);
        putIfPresent(alt, "zh", altZh);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.validation("file", "Could not read the upload");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(products.addImage(id, bytes, alt, credit)));
    }

    @PatchMapping("/{id}/images/{imageId}")
    ApiResponse<AdminProductDto> updateImage(
            @PathVariable UUID id, @PathVariable UUID imageId, @Valid @RequestBody ImageUpdateRequest req) {
        return ApiResponse.ok(products.updateImage(id, imageId, req));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    ResponseEntity<Void> deleteImage(@PathVariable UUID id, @PathVariable UUID imageId) {
        products.deleteImage(id, imageId);
        return ResponseEntity.noContent().build();
    }

    private static void putIfPresent(Map<String, String> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value.trim());
        }
    }
}
