package vn.beestore.api.mail;

import java.util.Map;

/**
 * Published by services inside their transaction; {@link MailEventListener} sends the email only after the commit, so
 * a mail failure never rolls back business data (README §6.6).
 *
 * @param template Thymeleaf template under {@code templates/mail/} and message prefix {@code mail.<template>.*}
 */
public record MailRequestedEvent(String template, String to, String locale, Map<String, Object> model) {}
