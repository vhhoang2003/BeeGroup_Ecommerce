package vn.beestore.api.auth.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.auth.domain.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Revokes every still-active token of a family (reuse detection, logout). */
    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);

    @Modifying
    @Query("update RefreshToken t set t.revokedAt = :now where t.user.id = :userId and t.revokedAt is null")
    int revokeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);

    /** Revokes the user's other sessions, keeping the one identified by {@code keepFamilyId}. */
    @Modifying
    @Query(
            """
            update RefreshToken t set t.revokedAt = :now
            where t.user.id = :userId and t.revokedAt is null
              and (:keepFamilyId is null or t.familyId <> :keepFamilyId)
            """)
    int revokeOthersForUser(
            @Param("userId") UUID userId, @Param("keepFamilyId") UUID keepFamilyId, @Param("now") Instant now);
}
