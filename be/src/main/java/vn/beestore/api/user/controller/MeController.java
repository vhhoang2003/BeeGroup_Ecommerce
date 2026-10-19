package vn.beestore.api.user.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.auth.controller.AuthController;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.user.dto.ProfileDtos.ChangeEmailRequest;
import vn.beestore.api.user.dto.ProfileDtos.ChangePasswordRequest;
import vn.beestore.api.user.dto.ProfileDtos.DeleteAccountRequest;
import vn.beestore.api.user.dto.ProfileDtos.UpdateProfileRequest;
import vn.beestore.api.user.dto.UserDto;
import vn.beestore.api.user.dto.UserMapper;
import vn.beestore.api.user.service.ProfileService;

/** {@code /api/v1/me} - the authenticated user's own account (README §8.3). */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final ProfileService profiles;
    private final UserMapper mapper;

    public MeController(ProfileService profiles, UserMapper mapper) {
        this.profiles = profiles;
        this.mapper = mapper;
    }

    @GetMapping
    ApiResponse<UserDto> me() {
        return ApiResponse.ok(mapper.toDto(profiles.get(CurrentUser.id())));
    }

    @PatchMapping
    ApiResponse<UserDto> update(@Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok(mapper.toDto(profiles.update(CurrentUser.id(), req)));
    }

    @PostMapping("/change-password")
    ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        profiles.changePassword(
                CurrentUser.id(), CurrentUser.familyId().orElse(null), req.currentPassword(), req.newPassword());
        return ApiResponse.ok(null, "Password changed");
    }

    @PostMapping("/change-email")
    ResponseEntity<ApiResponse<Void>> changeEmail(@Valid @RequestBody ChangeEmailRequest req) {
        profiles.requestEmailChange(CurrentUser.id(), req.newEmail(), req.password());
        return ResponseEntity.accepted().body(ApiResponse.ok(null, "Confirmation sent to the new email"));
    }

    @DeleteMapping
    ResponseEntity<Void> delete(@Valid @RequestBody DeleteAccountRequest req) {
        profiles.deleteAccount(CurrentUser.id(), req.password());
        String clear = ResponseCookie.from(AuthController.REFRESH_COOKIE, "")
                .path("/api/v1/auth")
                .maxAge(0)
                .httpOnly(true)
                .sameSite("Strict")
                .build()
                .toString();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, clear).build();
    }
}
