package vn.beestore.api.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.auth.dto.AuthDtos.EmailRequest;
import vn.beestore.api.auth.dto.AuthDtos.LoginRequest;
import vn.beestore.api.auth.dto.AuthDtos.LoginResponse;
import vn.beestore.api.auth.dto.AuthDtos.RefreshResponse;
import vn.beestore.api.auth.dto.AuthDtos.RegisterRequest;
import vn.beestore.api.auth.dto.AuthDtos.ResetPasswordRequest;
import vn.beestore.api.auth.dto.AuthDtos.TokenRequest;
import vn.beestore.api.auth.service.AuthService;
import vn.beestore.api.auth.service.JwtService;
import vn.beestore.api.auth.service.SessionService;
import vn.beestore.api.auth.service.SessionService.IssuedSession;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.common.web.ClientInfo;
import vn.beestore.api.user.dto.UserMapper;

/** {@code /api/v1/auth/*} (README §8.3). */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public static final String REFRESH_COOKIE = "refresh_token";
    static final String COOKIE_PATH = "/api/v1/auth";
    /** Custom header required on cookie-authenticated endpoints (SEC-06). */
    static final String CSRF_HEADER = "X-Requested-With";

    static final String CSRF_HEADER_VALUE = "beestore";

    private final AuthService auth;
    private final SessionService sessions;
    private final JwtService jwt;
    private final UserMapper userMapper;
    private final AppProperties props;

    public AuthController(
            AuthService auth, SessionService sessions, JwtService jwt, UserMapper userMapper, AppProperties props) {
        this.auth = auth;
        this.sessions = sessions;
        this.jwt = jwt;
        this.userMapper = userMapper;
        this.props = props;
    }

    @PostMapping("/register")
    ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        auth.register(req, ClientInfo.from(http));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null, "Verification email sent"));
    }

    @PostMapping("/verify-email")
    ApiResponse<Void> verifyEmail(@Valid @RequestBody TokenRequest req) {
        auth.verifyEmail(req.token());
        return ApiResponse.ok(null, "Email verified");
    }

    @PostMapping("/resend-verification")
    ResponseEntity<ApiResponse<Void>> resend(@Valid @RequestBody EmailRequest req) {
        auth.resendVerification(req.email());
        return ResponseEntity.accepted().body(ApiResponse.ok(null));
    }

    @PostMapping("/login")
    ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        IssuedSession session = auth.login(req.email(), req.password(), req.rememberMe(), ClientInfo.from(http));
        LoginResponse body =
                new LoginResponse(session.accessToken(), jwt.accessTtlSeconds(), userMapper.toDto(session.user()));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken(), session.refreshTtl()))
                .body(ApiResponse.ok(body));
    }

    @PostMapping("/refresh")
    ResponseEntity<ApiResponse<RefreshResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrfHeader,
            HttpServletRequest http) {
        requireCsrfHeader(csrfHeader);
        try {
            IssuedSession session = sessions.rotate(refreshToken, ClientInfo.from(http));
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken(), session.refreshTtl()))
                    .body(ApiResponse.ok(new RefreshResponse(session.accessToken(), jwt.accessTtlSeconds())));
        } catch (ApiException ex) {
            // Clear the dead cookie so the browser stops sending it.
            throw ex.withHeader(HttpHeaders.SET_COOKIE, clearCookie());
        }
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrfHeader) {
        requireCsrfHeader(csrfHeader);
        sessions.revoke(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie())
                .build();
    }

    @PostMapping("/logout-all")
    ResponseEntity<Void> logoutAll() {
        sessions.revokeAll(CurrentUser.id());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie())
                .build();
    }

    @PostMapping("/forgot-password")
    ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody EmailRequest req) {
        auth.forgotPassword(req.email());
        return ResponseEntity.accepted().body(ApiResponse.ok(null, "If an account exists, we sent an email"));
    }

    @PostMapping("/reset-password")
    ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        auth.resetPassword(req.token(), req.newPassword());
        return ApiResponse.ok(null, "Password changed");
    }

    private static void requireCsrfHeader(String value) {
        if (!CSRF_HEADER_VALUE.equals(value)) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "Missing X-Requested-With header");
        }
    }

    private String refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(props.security().cookieSecure())
                .sameSite("Strict")
                .path(COOKIE_PATH)
                .maxAge(maxAge)
                .build()
                .toString();
    }

    private String clearCookie() {
        return refreshCookie("", Duration.ZERO);
    }
}
