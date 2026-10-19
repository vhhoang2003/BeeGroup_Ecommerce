package vn.beestore.api.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Locale;
import java.util.Map;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import vn.beestore.api.common.config.AppProperties;

/** Renders a localized Thymeleaf email ({@code templates/mail/<template>.html}) and sends it over SMTP. */
@Service
public class MailService {

    private final JavaMailSender sender;
    private final TemplateEngine templates;
    private final MessageSource messages;
    private final AppProperties props;

    public MailService(JavaMailSender sender, TemplateEngine templates, MessageSource messages, AppProperties props) {
        this.sender = sender;
        this.templates = templates;
        this.messages = messages;
        this.props = props;
    }

    public void send(String template, String to, String localeTag, Map<String, Object> model)
            throws MessagingException {
        Locale locale = Locale.forLanguageTag(localeTag == null ? "vi" : localeTag);
        Context context = new Context(locale, model);
        context.setVariable("siteUrl", props.siteUrl());
        String html = templates.process("mail/" + template, context);
        String subject = messages.getMessage("mail." + template + ".subject", new Object[] {model.get("code")}, locale);

        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
        helper.setFrom(props.mail().from());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        sender.send(message);
    }
}
