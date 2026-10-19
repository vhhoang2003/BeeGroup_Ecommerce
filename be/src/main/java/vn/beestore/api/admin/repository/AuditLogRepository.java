package vn.beestore.api.admin.repository;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.admin.domain.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query(
            """
            select a from AuditLog a
            where (:entityType is null or a.entityType = :entityType)
              and (:entityId is null or a.entityId = :entityId)
              and (:actorId is null or a.actorId = :actorId)
            order by a.createdAt desc
            """)
    Page<AuditLog> search(
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("actorId") UUID actorId,
            Pageable pageable);
}
