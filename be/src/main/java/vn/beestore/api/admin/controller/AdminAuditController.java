package vn.beestore.api.admin.controller;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.admin.dto.AdminDtos.AuditLogDto;
import vn.beestore.api.admin.service.AuditService;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;

/** {@code GET /api/v1/admin/audit-logs} (ADM-08). */
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditService audit;

    public AdminAuditController(AuditService audit) {
        this.audit = audit;
    }

    @GetMapping
    ApiResponse<PaginatedResponse<AuditLogDto>> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var result = audit.search(
                entityType, entityId, actorId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200)));
        return ApiResponse.ok(PaginatedResponse.of(
                result,
                a -> new AuditLogDto(
                        a.getId(),
                        a.getActorId(),
                        a.getAction(),
                        a.getEntityType(),
                        a.getEntityId(),
                        a.getBefore(),
                        a.getAfter(),
                        a.getIpAddress(),
                        a.getCreatedAt())));
    }
}
