package vn.beestore.api.admin.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import vn.beestore.api.common.persistence.BaseEntity;

/** Who did what, when, with before/after snapshots (ADM-08, SEC-15). */
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode before;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode after;

    @Column(name = "ip_address", columnDefinition = "inet")
    @ColumnTransformer(read = "host(ip_address)", write = "cast(? as inet)")
    private String ipAddress;

    protected AuditLog() {}

    public AuditLog(
            UUID actorId,
            String action,
            String entityType,
            String entityId,
            JsonNode before,
            JsonNode after,
            String ipAddress) {
        this.actorId = actorId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.before = before;
        this.after = after;
        this.ipAddress = ipAddress;
    }

    public UUID getId() {
        return id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public JsonNode getBefore() {
        return before;
    }

    public JsonNode getAfter() {
        return after;
    }

    public String getIpAddress() {
        return ipAddress;
    }
}
