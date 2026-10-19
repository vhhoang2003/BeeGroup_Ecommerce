package vn.beestore.api.common.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code beestore.*} settings (README §14.1 environment variables). */
@ConfigurationProperties(prefix = "beestore")
public record AppProperties(
        Security security,
        Mail mail,
        String siteUrl,
        Storage storage,
        String catalogSourcePath,
        Revalidate revalidate,
        BootstrapAdmin bootstrapAdmin,
        RateLimit rateLimit,
        boolean importEndpointEnabled) {

    public record Security(
            String jwtSecret,
            Duration accessTtl,
            Duration refreshTtl,
            Duration refreshTtlRemember,
            boolean cookieSecure,
            List<String> corsAllowedOrigins,
            String turnstileSecret) {}

    public record Mail(String from, String salesNotifyEmail, String salesNotifyWebhook) {}

    public record Storage(String driver, String localPath, String publicBaseUrl) {}

    public record Revalidate(String url, String secret) {}

    public record BootstrapAdmin(String email, String password) {}

    public record RateLimit(boolean enabled) {}
}
