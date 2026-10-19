package vn.beestore.api.catalog.controller;

import java.nio.file.Path;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.admin.service.AuditService;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.catalog.importer.ImportReport;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;

/**
 * {@code POST /api/v1/admin/import} - runs the seed importer on {@code CATALOG_SOURCE_PATH} (ADM-07). Enabled only in
 * dev / staging ({@code beestore.import-endpoint-enabled}); production uses the CLI runner.
 */
@RestController
@RequestMapping("/api/v1/admin/import")
@PreAuthorize("hasRole('ADMIN')")
public class AdminImportController {

    private final CatalogImporter importer;
    private final AppProperties props;
    private final AuditService audit;

    public AdminImportController(CatalogImporter importer, AppProperties props, AuditService audit) {
        this.importer = importer;
        this.props = props;
        this.audit = audit;
    }

    @PostMapping
    ApiResponse<ImportReport> runImport() {
        if (!props.importEndpointEnabled()) {
            throw ApiException.notFound("Endpoint");
        }
        ImportReport report = importer.importFrom(Path.of(props.catalogSourcePath()));
        audit.record("CATALOG_IMPORT", "catalog", null, null, report);
        return ApiResponse.ok(report);
    }
}
