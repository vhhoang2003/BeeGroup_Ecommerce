package vn.beestore.api.user.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.auth.service.AuthService;
import vn.beestore.api.auth.service.PasswordPolicy;
import vn.beestore.api.auth.service.SecureTokens;
import vn.beestore.api.auth.service.SessionService;
import vn.beestore.api.auth.service.VerificationService;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.inquiry.repository.InquiryRepository;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.dto.ProfileDtos.UpdateProfileRequest;
import vn.beestore.api.user.repository.UserRepository;

/** Self-service profile, password, email and account deletion (AUTH-13..15, SEC-14). */
@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);
    static final Duration DELETION_GRACE = Duration.ofDays(30);

    private final UserRepository users;
    private final InquiryRepository inquiries;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final AuthService auth;
    private final SessionService sessions;
    private final VerificationService verification;
    private final Clock clock;

    public ProfileService(
            UserRepository users,
            InquiryRepository inquiries,
            PasswordEncoder passwordEncoder,
            PasswordPolicy passwordPolicy,
            AuthService auth,
            SessionService sessions,
            VerificationService verification,
            Clock clock) {
        this.users = users;
        this.inquiries = inquiries;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.auth = auth;
        this.sessions = sessions;
        this.verification = verification;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public User get(UUID userId) {
        return activeUser(userId);
    }

    @Transactional
    public User update(UUID userId, UpdateProfileRequest req) {
        User user = activeUser(userId);
        if (req.fullName() != null) {
            user.setFullName(req.fullName().trim());
        }
        if (req.phone() != null) {
            user.setPhone(req.phone().isBlank() ? null : req.phone());
        }
        if (req.preferredLocale() != null) {
            user.setPreferredLocale(req.preferredLocale());
        }
        if (req.preferredContact() != null) {
            user.setPreferredContact(req.preferredContact());
        }
        return user;
    }

    /** Requires the current password; keeps the caller's session and revokes the others (AUTH-13). */
    @Transactional
    public void changePassword(UUID userId, UUID currentFamilyId, String currentPassword, String newPassword) {
        User user = activeUser(userId);
        requirePassword(user, currentPassword, "currentPassword");
        passwordPolicy.check(newPassword, user.getEmail(), "newPassword");
        auth.changePassword(user, newPassword, currentFamilyId);
    }

    /** Sends a confirmation link to the new address; the email changes only once it is verified (AUTH-14). */
    @Transactional
    public void requestEmailChange(UUID userId, String rawNewEmail, String password) {
        User user = activeUser(userId);
        requirePassword(user, password, "password");
        String newEmail = AuthService.normalizeEmail(rawNewEmail);
        if (newEmail.equals(user.getEmail())) {
            throw ApiException.validation("newEmail", "New email is the same as the current one");
        }
        if (users.existsByEmail(newEmail)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email already registered");
        }
        verification.sendEmailChange(user, newEmail);
    }

    /** Soft-deletes now; personal data is anonymized after 30 days by {@link #anonymizeDeletedAccounts()}. */
    @Transactional
    public void deleteAccount(UUID userId, String password) {
        User user = activeUser(userId);
        requirePassword(user, password, "password");
        user.setStatus(UserStatus.DELETED);
        user.setDeletedAt(clock.instant());
        sessions.revokeAll(user.getId());
    }

    /** Daily at 03:00 ICT: anonymize accounts deleted more than 30 days ago (AUTH-15, SEC-14). */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public int anonymizeDeletedAccounts() {
        Instant cutoff = clock.instant().minus(DELETION_GRACE);
        List<User> expired = users.findDeletedBefore(UserStatus.DELETED, cutoff);
        for (User user : expired) {
            inquiries.anonymizeForUser(user.getId());
            user.setEmail("deleted-" + user.getId() + "@deleted.invalid");
            user.setFullName("Deleted user");
            user.setPhone(null);
            user.setPreferredContact(null);
            user.setPasswordHash(passwordEncoder.encode(SecureTokens.newToken()));
        }
        if (!expired.isEmpty()) {
            log.info("Anonymized {} deleted account(s)", expired.size());
        }
        return expired.size();
    }

    private User activeUser(UUID userId) {
        return users.findById(userId)
                .filter(u -> u.getStatus() != UserStatus.DELETED)
                .orElseThrow(() -> ApiException.notFound("User"));
    }

    private void requirePassword(User user, String password, String field) {
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.validation(field, "Password is incorrect");
        }
    }
}
