package vn.beestore.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import vn.beestore.api.auth.dto.AuthDtos;
import vn.beestore.api.user.domain.ContactChannel;

/** Bodies of {@code /api/v1/me/*} (README §8.3, AUTH-13..15). */
public final class ProfileDtos {

    private ProfileDtos() {}

    /** All fields optional; {@code null} leaves the value unchanged, an empty phone clears it. */
    public record UpdateProfileRequest(
            @Size(min = 1, max = 100) String fullName,
            @Pattern(regexp = "^$|" + AuthDtos.PHONE_PATTERN, message = "must be in E.164 format, e.g. +84901234567")
                    String phone,
            @Pattern(regexp = AuthDtos.LOCALE_PATTERN) String preferredLocale,
            ContactChannel preferredContact) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {}

    public record ChangeEmailRequest(@NotBlank @Email @Size(max = 254) String newEmail, @NotBlank String password) {

        public ChangeEmailRequest {
            newEmail = AuthDtos.trim(newEmail);
        }
    }

    public record DeleteAccountRequest(@NotBlank String password) {}
}
