package vn.beestore.api.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import vn.beestore.api.auth.domain.TokenType;
import vn.beestore.api.auth.domain.VerificationToken;
import vn.beestore.api.auth.repository.VerificationTokenRepository;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.mail.MailRequestedEvent;
import vn.beestore.api.user.domain.User;

/** Single-use email tokens: verification (24 h), password reset (30 min), email change (24 h) - SEC-05. */
@Service
public class VerificationService {

    static final Duration VERIFICATION_TTL = Duration.ofHours(24);
    static final Duration RESET_TTL = Duration.ofMinutes(30);
    static final Duration EMAIL_CHANGE_TTL = Duration.ofHours(24);
    static final String NEW_EMAIL = "newEmail";

    private final VerificationTokenRepository tokens;
    private final ApplicationEventPublisher events;
    private final AppProperties props;
    private final Clock clock;

    public VerificationService(
            VerificationTokenRepository tokens, ApplicationEventPublisher events, AppProperties props, Clock clock) {
        this.tokens = tokens;
        this.events = events;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public void sendEmailVerification(User user) {
        String raw = issue(user, TokenType.EMAIL_VERIFICATION, VERIFICATION_TTL, null);
        publish("verify-email", user.getEmail(), user, link("/auth/verify-email", raw));
    }

    @Transactional
    public void sendPasswordReset(User user) {
        String raw = issue(user, TokenType.PASSWORD_RESET, RESET_TTL, null);
        publish("reset-password", user.getEmail(), user, link("/auth/reset-password", raw));
    }

    @Transactional
    public void sendEmailChange(User user, String newEmail) {
        String raw = issue(user, TokenType.EMAIL_CHANGE, EMAIL_CHANGE_TTL, Map.of(NEW_EMAIL, newEmail));
        publish("change-email", newEmail, user, link("/auth/verify-email", raw));
    }

    /** Finds a usable token of one of {@code types} and marks it used, or throws {@code TOKEN_INVALID_OR_EXPIRED}. */
    @Transactional
    public VerificationToken consume(String rawToken, TokenType... types) {
        Instant now = clock.instant();
        VerificationToken token = tokens.findByTokenHash(SecureTokens.sha256(rawToken))
                .filter(t -> java.util.Arrays.asList(types).contains(t.getType()))
                .filter(t -> t.isUsable(now))
                .orElseThrow(() ->
                        new ApiException(ErrorCode.TOKEN_INVALID_OR_EXPIRED, "The link is invalid or has expired"));
        token.setUsedAt(now);
        return token;
    }

    private String issue(User user, TokenType type, Duration ttl, Map<String, String> payload) {
        Instant now = clock.instant();
        tokens.invalidateAll(user.getId(), type, now);
        String raw = SecureTokens.newToken();
        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setType(type);
        token.setTokenHash(SecureTokens.sha256(raw));
        token.setPayload(payload);
        token.setExpiresAt(now.plus(ttl));
        tokens.save(token);
        return raw;
    }

    private String link(String path, String rawToken) {
        return UriComponentsBuilder.fromUriString(props.siteUrl())
                .path(path)
                .queryParam("token", rawToken)
                .build()
                .toUriString();
    }

    private void publish(String template, String to, User user, String link) {
        events.publishEvent(new MailRequestedEvent(
                template, to, user.getPreferredLocale(), Map.of("name", user.getFullName(), "link", link)));
    }
}
