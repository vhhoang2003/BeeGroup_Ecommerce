package vn.beestore.api.inquiry.service;

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
import vn.beestore.api.inquiry.domain.Inquiry;

/**
 * Optional Telegram / Discord / Slack webhook for new inquiries ({@code SALES_NOTIFY_WEBHOOK}, ENG-03). Sends
 * {@code {"content": ..., "text": ...}}, which Discord (content), Slack and Telegram's sendMessage (text) accept.
 */
@Component
public class SalesWebhookNotifier {

    private static final Logger log = LoggerFactory.getLogger(SalesWebhookNotifier.class);
    static final int MAX_ATTEMPTS = 3;

    private final RestClient http;
    private final String webhookUrl;

    public SalesWebhookNotifier(RestClient.Builder builder, AppProperties props) {
        this.http = builder.build();
        this.webhookUrl = props.mail().salesNotifyWebhook();
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onInquiryCreated(InquiryCreatedEvent event) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            return;
        }
        long backoff = 1000;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                http.post()
                        .uri(webhookUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("content", event.summary(), "text", event.summary()))
                        .retrieve()
                        .toBodilessEntity();
                return;
            } catch (Exception e) {
                log.warn(
                        "Sales webhook failed for {} (attempt {}/{}): {}",
                        event.code(),
                        attempt,
                        MAX_ATTEMPTS,
                        e.toString());
                if (attempt < MAX_ATTEMPTS) {
                    sleep(backoff);
                    backoff *= 2;
                }
            }
        }
    }

    /** One-line summary for chat channels. */
    static String summary(Inquiry inquiry, String siteUrl) {
        StringBuilder sb = new StringBuilder("New inquiry ").append(inquiry.getCode());
        if (inquiry.getProductSnapshot() != null) {
            sb.append(": ")
                    .append(inquiry.getProductSnapshot().name())
                    .append(" x ")
                    .append(inquiry.getQuantity());
        } else if (inquiry.getSubject() != null) {
            sb.append(": ").append(inquiry.getSubject());
        }
        sb.append(" - ").append(inquiry.getFullName());
        if (inquiry.getPreferredContact() != null) {
            sb.append(" (").append(inquiry.getPreferredContact()).append(")");
        }
        sb.append(" - ").append(siteUrl).append("/admin/inquiries");
        return sb.toString();
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
