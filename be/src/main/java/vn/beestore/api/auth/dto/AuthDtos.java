package vn.beestore.api.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import vn.beestore.api.user.dto.UserDto;

/** Request / response bodies of {@code /api/v1/auth/*} (README §8.3). */
public final class AuthDtos {

    private AuthDtos() {}

    public static final String PHONE_PATTERN = "^\\+[1-9]\\d{6,14}$";
    public static final String LOCALE_PATTERN = "^(vi|en|zh)$";

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 72) String password,
            /** Optional server-side check of the confirmation field (AUTH-01); the FE validates it too. */
            String passwordConfirmation,
            @Pattern(regexp = PHONE_PATTERN, message = "must be in E.164 format, e.g. +84901234567") String phone,
            @AssertTrue(message = "must accept the Terms and Privacy Policy") boolean acceptTerms,
            @Pattern(regexp = LOCALE_PATTERN) String locale) {

        public RegisterRequest {
            email = trim(email);
        }
    }

    public record TokenRequest(@NotBlank String token) {}

    public record EmailRequest(@NotBlank @Email String email) {

        public EmailRequest {
            email = trim(email);
        }
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password, boolean rememberMe) {

        public LoginRequest {
            email = trim(email);
        }
    }

    public record ResetPasswordRequest(@NotBlank String token, @NotBlank String newPassword) {}

    public record LoginResponse(String accessToken, long expiresIn, UserDto user) {}

    public record RefreshResponse(String accessToken, long expiresIn) {}

    /** Emails are trimmed before validation (AUTH-02); lowercasing happens in the service. */
    public static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
