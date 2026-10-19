package vn.beestore.api.user.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;

public interface UserRepository extends JpaRepository<User, UUID> {

    /** {@code email} must already be normalized (trimmed, lowercase). */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);

    /** Soft-deleted accounts past the 30-day grace period that still hold personal data (AUTH-15). */
    @Query("select u from User u where u.status = :status and u.deletedAt < :before and u.email not like 'deleted-%'")
    List<User> findDeletedBefore(@Param("status") UserStatus status, @Param("before") Instant before);

    @Query(
            """
            select u from User u
            where (:q is null or lower(u.email) like lower(concat('%', cast(:q as string), '%'))
                   or lower(u.fullName) like lower(concat('%', cast(:q as string), '%')))
              and (:role is null or u.role = :role)
              and (:status is null or u.status = :status)
            """)
    Page<User> search(
            @Param("q") String q, @Param("role") Role role, @Param("status") UserStatus status, Pageable pageable);
}
