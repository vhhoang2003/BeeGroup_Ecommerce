package vn.beestore.api.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.user.domain.User;

/** Issues HS256 access tokens with claims {@code sub, roles, iat, exp, jti} (SEC-03). */
@Service
public class JwtService {

    /** Refresh-token family of the session, so "change password" can keep the current session (AUTH-13). */
    public static final String FAMILY_CLAIM = "fid";

    public static final String ROLES_CLAIM = "roles";

    private final JwtEncoder encoder;
    private final Duration accessTtl;
    private final Clock clock;

    public JwtService(JwtEncoder encoder, AppProperties props, Clock clock) {
        this.encoder = encoder;
        this.accessTtl = props.security().accessTtl();
        this.clock = clock;
    }

    public String issueAccessToken(User user, UUID familyId) {
        Instant now = clock.instant();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .subject(user.getId().toString())
                .claim(ROLES_CLAIM, List.of(user.getRole().name()))
                .issuedAt(now)
                .expiresAt(now.plus(accessTtl))
                .id(UUID.randomUUID().toString());
        if (familyId != null) {
            claims.claim(FAMILY_CLAIM, familyId.toString());
        }
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
    }

    public long accessTtlSeconds() {
        return accessTtl.toSeconds();
    }
}
