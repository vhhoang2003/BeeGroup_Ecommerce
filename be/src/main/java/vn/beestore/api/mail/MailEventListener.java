package vn.beestore.api.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Sends emails after commit, asynchronously, retrying 3 times with exponential backoff (README §6.6). */
@Component
public class MailEventListener {

    private static final Logger log = LoggerFactory.getLogger(MailEventListener.class);
    static final int MAX_ATTEMPTS = 3;
    static final long INITIAL_BACKOFF_MS = 1000;

    private final MailService mailService;

    public MailEventListener(MailService mailService) {
        this.mailService = mailService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMailRequested(MailRequestedEvent event) {
        long backoff = INITIAL_BACKOFF_MS;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                mailService.send(event.template(), event.to(), event.locale(), event.model());
                return;
            } catch (Exception ex) {
                // Never log the recipient's full address or the model (it can carry tokens) - SEC-14.
                log.warn(
                        "Sending '{}' email failed (attempt {}/{}): {}",
                        event.template(),
                        attempt,
                        MAX_ATTEMPTS,
                        ex.toString());
                if (attempt == MAX_ATTEMPTS) {
                    log.error("Giving up on '{}' email after {} attempts", event.template(), MAX_ATTEMPTS);
                    return;
                }
                sleep(backoff);
                backoff *= 2;
            }
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
