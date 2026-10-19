package vn.beestore.api.support;

import java.nio.file.Path;
import vn.beestore.api.catalog.importer.CatalogImporter;
import vn.beestore.api.catalog.importer.ImportReport;

/** Imports the real {@code product/} seed folder once per test run (the import is idempotent). */
public final class CatalogFixture {

    /** Tests run with {@code be/} as working directory. */
    public static final Path SEED = Path.of("..", "product");

    private static volatile ImportReport firstReport;

    private CatalogFixture() {}

    public static synchronized ImportReport ensureImported(CatalogImporter importer) {
        if (firstReport == null) {
            firstReport = importer.importFrom(SEED);
        }
        return firstReport;
    }
}
