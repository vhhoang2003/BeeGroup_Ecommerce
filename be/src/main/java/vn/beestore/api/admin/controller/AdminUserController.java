package vn.beestore.api.admin.controller;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.admin.dto.AdminDtos.UserUpdateRequest;
import vn.beestore.api.admin.service.AdminUserService;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.dto.UserDto;

/** {@code /api/v1/admin/users} (ADM-06). */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService users;

    public AdminUserController(AdminUserService users) {
        this.users = users;
    }

    @GetMapping
    ApiResponse<PaginatedResponse<UserDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(users.search(q, role, status, page, size));
    }

    @GetMapping("/{id}")
    ApiResponse<UserDto> get(@PathVariable UUID id) {
        return ApiResponse.ok(users.get(id));
    }

    @PatchMapping("/{id}")
    ApiResponse<UserDto> update(@PathVariable UUID id, @RequestBody UserUpdateRequest req) {
        return ApiResponse.ok(users.update(id, req));
    }
}
