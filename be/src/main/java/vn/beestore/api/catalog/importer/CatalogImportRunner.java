package vn.beestore.api.catalog.importer;

import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * One-off import from the command line (README §6.8 step 1):
 * {@code java -jar app.jar --import.catalog.path=/data/product}. The application exits when the import finishes, with
 * exit code 1 if any product failed.
 */
@Component
@Order(100)
public class CatalogImportRunner implements ApplicationRunner {

    static final String OPTION = "import.catalog.path";
    private static final Logger log = LoggerFactory.getLogger(CatalogImportRunner.class);

    private final CatalogImporter importer;
    private final ConfigurableApplicationContext context;

    public CatalogImportRunner(CatalogImporter importer, ConfigurableApplicationContext context) {
        this.importer = importer;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!args.containsOption(OPTION) || args.getOptionValues(OPTION).isEmpty()) {
            return;
        }
        ImportReport report =
                importer.importFrom(Path.of(args.getOptionValues(OPTION).get(0)));
        report.errors().forEach(e -> log.error("Import error: {}", e));
        int code = report.errors().isEmpty() ? 0 : 1;
        System.exit(SpringApplication.exit(context, () -> code));
    }
}
