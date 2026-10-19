package vn.beestore.api.admin.service;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;
import vn.beestore.api.common.config.AppProperties;

/**
 * Asks Next.js to re-render pages after admin edits (README §6.7): {@code POST REVALIDATE_URL} with
 * {@code {"secret": REVALIDATE_SECRET, "paths": [...]}}. Skipped when not configured; failures are logged only, the
 * pages still refresh through ISR within 5 minutes (AD-4).
 */
@Component
public class RevalidationNotifier {

    private static final Logger log = LoggerFactory.getLogger(RevalidationNotifier.class);

    /** Published by admin services; handled after the transaction commits. */
    public record ContentChanged(List<String> paths) {}

    private final RestClient http;
    private final String url;
    private final String secret;

    public RevalidationNotifier(RestClient.Builder builder, AppProperties props) {
        this.http = builder.build();
        this.url = props.revalidate() == null ? null : props.revalidate().url();
        this.secret = props.revalidate() == null ? null : props.revalidate().secret();
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContentChanged(ContentChanged event) {
        if (url == null || url.isBlank() || secret == null || secret.isBlank()) {
            return;
        }
        try {
            http.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("secret", secret, "paths", event.paths()))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Revalidation of {} failed: {}", event.paths(), e.toString());
        }
    }
}
