package vn.beestore.api.auth.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.auth.domain.TokenType;
import vn.beestore.api.auth.domain.VerificationToken;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByTokenHashAndType(String tokenHash, TokenType type);

    Optional<VerificationToken> findByTokenHash(String tokenHash);

    /** Marks earlier unused tokens of the same type as used, so only the newest link works. */
    @Modifying
    @Query(
            """
            update VerificationToken t set t.usedAt = :now
            where t.user.id = :userId and t.type = :type and t.usedAt is null
            """)
    int invalidateAll(@Param("userId") UUID userId, @Param("type") TokenType type, @Param("now") Instant now);
}
