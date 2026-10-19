package vn.beestore.api.common.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import vn.beestore.api.auth.service.JwtService;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/** Reads the authenticated user from the JWT in the security context. */
public final class CurrentUser {

    private CurrentUser() {}

    public static Optional<UUID> idIfPresent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            return Optional.of(UUID.fromString(jwt.getToken().getSubject()));
        }
        return Optional.empty();
    }

    public static UUID id() {
        return idIfPresent().orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED, "Authentication required"));
    }

    /** Refresh-token family of the current session, if the access token carries one. */
    public static Optional<UUID> familyId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            String fid = jwt.getToken().getClaimAsString(JwtService.FAMILY_CLAIM);
            return Optional.ofNullable(fid).map(UUID::fromString);
        }
        return Optional.empty();
    }
}
