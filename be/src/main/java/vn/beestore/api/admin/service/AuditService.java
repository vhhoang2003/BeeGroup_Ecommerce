package vn.beestore.api.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import vn.beestore.api.admin.domain.AuditLog;
import vn.beestore.api.admin.repository.AuditLogRepository;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.common.web.ClientInfo;

/** Records admin writes with before / after snapshots (ADM-08, SEC-15). */
@Service
public class AuditService {

    private final AuditLogRepository logs;
    private final ObjectMapper json;

    public AuditService(AuditLogRepository logs, ObjectMapper json) {
        this.logs = logs;
        this.json = json;
    }

    /** Joins the caller's transaction so the log entry commits (or rolls back) with the change itself. */
    @Transactional(propagation = Propagation.REQUIRED)
    public void record(String action, String entityType, Object entityId, Object before, Object after) {
        logs.save(new AuditLog(
                CurrentUser.idIfPresent().orElse(null),
                action,
                entityType,
                entityId == null ? null : entityId.toString(),
                toJson(before),
                toJson(after),
                currentIp()));
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> search(String entityType, String entityId, UUID actorId, Pageable pageable) {
        return logs.search(entityType, entityId, actorId, pageable);
    }

    private JsonNode toJson(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof JsonNode node ? node : json.valueToTree(value);
    }

    private static String currentIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            return ClientInfo.from(request).ip();
        }
        return null;
    }
}
