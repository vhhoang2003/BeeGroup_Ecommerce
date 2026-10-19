package vn.beestore.api.catalog.importer;

import java.util.ArrayList;
import java.util.List;

/** Result of a catalog import run (README §6.8 step 4). */
public record ImportReport(
        int categoriesCreated,
        int categoriesUpdated,
        int productsCreated,
        int productsUpdated,
        int productsSkipped,
        List<String> errors) {

    static final class Builder {
        int categoriesCreated;
        int categoriesUpdated;
        int productsCreated;
        int productsUpdated;
        int productsSkipped;
        final List<String> errors = new ArrayList<>();

        ImportReport build() {
            return new ImportReport(
                    categoriesCreated,
                    categoriesUpdated,
                    productsCreated,
                    productsUpdated,
                    productsSkipped,
                    List.copyOf(errors));
        }
    }
}
