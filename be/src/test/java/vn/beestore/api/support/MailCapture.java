package vn.beestore.api.support;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.context.event.EventListener;
import vn.beestore.api.mail.MailRequestedEvent;

/** Records every requested email so tests can follow verification / reset links. */
@TestComponent
public class MailCapture {

    private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    private final List<MailRequestedEvent> events = new CopyOnWriteArrayList<>();

    @EventListener
    void on(MailRequestedEvent event) {
        events.add(event);
    }

    public List<MailRequestedEvent> to(String email) {
        return events.stream().filter(e -> e.to().equalsIgnoreCase(email)).toList();
    }

    /** Raw token from the most recent email of {@code template} sent to {@code email}. */
    public String lastToken(String email, String template) {
        MailRequestedEvent event = to(email).stream()
                .filter(e -> e.template().equals(template))
                .reduce((a, b) -> b)
                .orElseThrow(() -> new AssertionError("No '" + template + "' email sent to " + email));
        Matcher m = TOKEN.matcher(String.valueOf(event.model().get("link")));
        if (!m.find()) {
            throw new AssertionError("No token in link: " + event.model().get("link"));
        }
        return m.group(1);
    }
}
