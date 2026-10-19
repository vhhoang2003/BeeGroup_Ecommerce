package vn.beestore.api.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.auth.domain.RefreshToken;
import vn.beestore.api.auth.repository.RefreshTokenRepository;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.common.web.ClientInfo;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;

/**
 * Refresh-token sessions with rotation and reuse detection (AUTH-09, SEC-04, README §6.3). Every login starts a new
 * token family; each refresh revokes the presented token and issues its successor in the same family. Presenting an
 * already-revoked token revokes the whole family.
 */
@Service
public class SessionService {

    private final RefreshTokenRepository tokens;
    private final JwtService jwt;
    private final AppProperties props;
    private final Clock clock;

    public SessionService(RefreshTokenRepository tokens, JwtService jwt, AppProperties props, Clock clock) {
        this.tokens = tokens;
        this.jwt = jwt;
        this.props = props;
        this.clock = clock;
    }

    public record IssuedSession(
            String accessToken, String refreshToken, Duration refreshTtl, User user, UUID refreshTokenId) {}

    @Transactional
    public IssuedSession start(User user, boolean rememberMe, ClientInfo client) {
        return issue(user, UUID.randomUUID(), rememberMe, client);
    }

    /** Rotates the refresh token. Reuse revocations are committed even though the call fails. */
    @Transactional(noRollbackFor = ApiException.class)
    public IssuedSession rotate(String rawRefreshToken, ClientInfo client) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw invalid();
        }
        Instant now = clock.instant();
        RefreshToken current =
                tokens.findByTokenHash(SecureTokens.sha256(rawRefreshToken)).orElseThrow(SessionService::invalid);

        if (current.getRevokedAt() != null) {
            if (current.getReplacedBy() == null) {
                // Revoked by logout / password reset / admin action, not by rotation: just a dead session.
                throw invalid();
            }
            // An already-rotated token came back: assume theft and kill the whole family (README §6.3).
            tokens.revokeFamily(current.getFamilyId(), now);
            throw new ApiException(ErrorCode.REFRESH_TOKEN_REUSED, "Refresh token reuse detected; please log in again");
        }
        if (!current.getExpiresAt().isAfter(now)) {
            throw invalid();
        }
        User user = current.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            tokens.revokeFamily(current.getFamilyId(), now);
            throw invalid();
        }

        IssuedSession next = issue(user, current.getFamilyId(), current.isRememberMe(), client);
        current.setRevokedAt(now);
        current.setReplacedBy(next.refreshTokenId());
        return next;
    }

    /** Revokes the presented token's family (logout of this device). Unknown tokens are ignored. */
    @Transactional
    public void revoke(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        tokens.findByTokenHash(SecureTokens.sha256(rawRefreshToken))
                .ifPresent(t -> tokens.revokeFamily(t.getFamilyId(), clock.instant()));
    }

    @Transactional
    public void revokeAll(UUID userId) {
        tokens.revokeAllForUser(userId, clock.instant());
    }

    @Transactional
    public void revokeOthers(UUID userId, UUID keepFamilyId) {
        tokens.revokeOthersForUser(userId, keepFamilyId, clock.instant());
    }

    private IssuedSession issue(User user, UUID familyId, boolean rememberMe, ClientInfo client) {
        Duration ttl = rememberMe
                ? props.security().refreshTtlRemember()
                : props.security().refreshTtl();
        String raw = SecureTokens.newToken();
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(SecureTokens.sha256(raw));
        token.setFamilyId(familyId);
        token.setRememberMe(rememberMe);
        token.setExpiresAt(clock.instant().plus(ttl));
        if (client != null) {
            token.setUserAgent(client.userAgent());
            token.setIpAddress(client.ip());
        }
        tokens.saveAndFlush(token);
        return new IssuedSession(jwt.issueAccessToken(user, familyId), raw, ttl, user, token.getId());
    }

    private static ApiException invalid() {
        return new ApiException(ErrorCode.REFRESH_TOKEN_INVALID, "Session expired; please log in again");
    }
}
