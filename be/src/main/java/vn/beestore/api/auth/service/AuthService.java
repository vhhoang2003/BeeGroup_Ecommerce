package vn.beestore.api.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.auth.domain.TokenType;
import vn.beestore.api.auth.domain.VerificationToken;
import vn.beestore.api.auth.dto.AuthDtos.RegisterRequest;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.common.ratelimit.RateLimitPolicy;
import vn.beestore.api.common.ratelimit.RateLimiter;
import vn.beestore.api.common.web.ClientInfo;
import vn.beestore.api.mail.MailRequestedEvent;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.repository.UserRepository;

/** Registration, email verification, login with lockout, forgot / reset password (AUTH-01..12, README §6.1-6.4). */
@Service
public class AuthService {

    static final int MAX_FAILED_LOGINS = 5;
    static final Duration FAILURE_WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final VerificationService verification;
    private final SessionService sessions;
    private final RateLimiter rateLimiter;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    /** Hash compared against when the email is unknown, so response time does not reveal accounts (AUTH-07). */
    private final String dummyHash;

    public AuthService(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            PasswordPolicy passwordPolicy,
            VerificationService verification,
            SessionService sessions,
            RateLimiter rateLimiter,
            ApplicationEventPublisher events,
            Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.verification = verification;
        this.sessions = sessions;
        this.rateLimiter = rateLimiter;
        this.events = events;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("dummy-password-1");
    }

    public static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public User register(RegisterRequest req, ClientInfo client) {
        rateLimiter.check(RateLimitPolicy.REGISTER_IP, client.ip());
        String email = normalizeEmail(req.email());
        if (req.passwordConfirmation() != null && !req.passwordConfirmation().equals(req.password())) {
            throw ApiException.validation("passwordConfirmation", "Passwords do not match");
        }
        passwordPolicy.check(req.password(), email, "password");
        if (users.existsByEmail(email)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(req.fullName().trim());
        user.setPhone(req.phone());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.CUSTOMER);
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setPreferredLocale(req.locale() == null ? "vi" : req.locale());
        user.setTermsAcceptedAt(clock.instant());
        users.save(user);

        verification.sendEmailVerification(user);
        return user;
    }

    /** Verifies a registration link, or confirms an email change (same {@code /auth/verify-email} page). */
    @Transactional
    public void verifyEmail(String rawToken) {
        VerificationToken token = verification.consume(rawToken, TokenType.EMAIL_VERIFICATION, TokenType.EMAIL_CHANGE);
        User user = token.getUser();
        Instant now = clock.instant();
        if (token.getType() == TokenType.EMAIL_CHANGE) {
            String newEmail = token.getPayload().get(VerificationService.NEW_EMAIL);
            if (users.existsByEmail(newEmail)) {
                throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email already registered");
            }
            user.setEmail(newEmail);
        } else if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
        }
        user.setEmailVerifiedAt(now);
    }

    /** Always succeeds from the caller's point of view; only pending accounts get a new email (AUTH-05). */
    @Transactional
    public void resendVerification(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        rateLimiter.check(RateLimitPolicy.RESEND_VERIFICATION_EMAIL, email);
        users.findByEmail(email)
                .filter(u -> u.getStatus() == UserStatus.PENDING_VERIFICATION)
                .ifPresent(verification::sendEmailVerification);
    }

    /** Failure counters are committed even when the login fails. */
    @Transactional(noRollbackFor = ApiException.class)
    public SessionService.IssuedSession login(String rawEmail, String password, boolean rememberMe, ClientInfo client) {
        rateLimiter.check(RateLimitPolicy.LOGIN_IP, client.ip());
        Instant now = clock.instant();
        User user = users.findByEmail(normalizeEmail(rawEmail)).orElse(null);

        if (user == null || user.getStatus() == UserStatus.DELETED) {
            passwordEncoder.matches(password, dummyHash);
            throw invalidCredentials();
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(ErrorCode.ACCOUNT_LOCKED, "Account is locked; please contact support");
        }
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw ApiException.withRetryAfter(
                    ErrorCode.ACCOUNT_LOCKED,
                    "Too many failed attempts; try again later",
                    Duration.between(now, user.getLockedUntil()));
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            recordFailure(user, now);
            throw invalidCredentials();
        }
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new ApiException(ErrorCode.EMAIL_NOT_VERIFIED, "Please verify your email before logging in");
        }

        user.setFailedLoginCount(0);
        user.setFailedLoginWindowStart(null);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        return sessions.start(user, rememberMe, client);
    }

    /** Always returns normally - "If an account exists, we sent an email" (AUTH-11). */
    @Transactional
    public void forgotPassword(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        rateLimiter.check(RateLimitPolicy.FORGOT_PASSWORD_EMAIL, email);
        users.findByEmail(email)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .ifPresent(verification::sendPasswordReset);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        VerificationToken token = verification.consume(rawToken, TokenType.PASSWORD_RESET);
        User user = token.getUser();
        passwordPolicy.check(newPassword, user.getEmail(), "newPassword");
        changePassword(user, newPassword, null);
    }

    /**
     * Sets a new password, revokes sessions (all, or all but {@code keepFamilyId}) and sends the confirmation email
     * (AUTH-12, AUTH-13).
     */
    @Transactional
    public void changePassword(User user, String newPassword, java.util.UUID keepFamilyId) {
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginCount(0);
        user.setFailedLoginWindowStart(null);
        user.setLockedUntil(null);
        if (keepFamilyId == null) {
            sessions.revokeAll(user.getId());
        } else {
            sessions.revokeOthers(user.getId(), keepFamilyId);
        }
        events.publishEvent(new MailRequestedEvent(
                "password-changed", user.getEmail(), user.getPreferredLocale(), Map.of("name", user.getFullName())));
    }

    private void recordFailure(User user, Instant now) {
        Instant windowStart = user.getFailedLoginWindowStart();
        if (windowStart == null || !now.isBefore(windowStart.plus(FAILURE_WINDOW))) {
            user.setFailedLoginWindowStart(now);
            user.setFailedLoginCount(1);
        } else {
            user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        }
        if (user.getFailedLoginCount() >= MAX_FAILED_LOGINS) {
            user.setLockedUntil(now.plus(LOCK_DURATION));
            user.setFailedLoginCount(0);
            user.setFailedLoginWindowStart(null);
        }
    }

    private static ApiException invalidCredentials() {
        return new ApiException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
    }
}
