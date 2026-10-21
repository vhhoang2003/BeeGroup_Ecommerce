package vn.beestore.api.admin.controller;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.beestore.api.admin.dto.AdminDtos.SheetImportReport;
import vn.beestore.api.admin.sheet.ProductSheetExporter;
import vn.beestore.api.admin.sheet.ProductSheetImporter;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.error.ApiException;

/**
 * {@code /api/v1/admin/products/sheet}: the price list workbook. {@code GET} downloads it filled with the current
 * catalog; {@code POST} (multipart {@code file}) checks it, and with {@code apply=true} imports it.
 */
@RestController
@RequestMapping("/api/v1/admin/products/sheet")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductSheetController {

    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ProductSheetExporter exporter;
    private final ProductSheetImporter importer;
    private final Clock clock;

    public AdminProductSheetController(ProductSheetExporter exporter, ProductSheetImporter importer, Clock clock) {
        this.exporter = exporter;
        this.importer = importer;
        this.clock = clock;
    }

    @GetMapping
    ResponseEntity<byte[]> download() {
        String filename = "beestore-bang-gia-" + LocalDate.now(clock.withZone(VIETNAM)) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename)
                                .build()
                                .toString())
                .body(exporter.export());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<SheetImportReport> upload(
            @RequestPart("file") MultipartFile file, @RequestParam(defaultValue = "false") boolean apply) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.validation("file", "Could not read the upload");
        }
        if (bytes.length == 0) {
            throw ApiException.validation("file", "The file is empty");
        }
        return ApiResponse.ok(importer.importSheet(bytes, apply));
    }
}
