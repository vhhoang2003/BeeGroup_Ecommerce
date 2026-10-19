package vn.beestore.api.inquiry.service;

import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/**
 * Cloudflare Turnstile verification for guest submissions (ENG-02). Without {@code TURNSTILE_SECRET} the check is
 * skipped outside the {@code prod} profile (local development) and fails closed in production.
 */
@Component
public class CaptchaVerifier {

    static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private static final Logger log = LoggerFactory.getLogger(CaptchaVerifier.class);

    private final RestClient http;
    private final String secret;
    private final boolean production;

    public CaptchaVerifier(RestClient.Builder builder, AppProperties props, Environment env) {
        this.http = builder.build();
        this.secret = props.security().turnstileSecret();
        this.production = Arrays.asList(env.getActiveProfiles()).contains("prod");
    }

    public void verify(String token, String remoteIp) {
        if (secret == null || secret.isBlank()) {
            if (production) {
                throw new ApiException(ErrorCode.CAPTCHA_FAILED, "Captcha is not configured");
            }
            log.warn("TURNSTILE_SECRET is not set; skipping captcha verification (non-production only)");
            return;
        }
        if (token == null || token.isBlank()) {
            throw new ApiException(ErrorCode.CAPTCHA_FAILED, "Captcha verification failed");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secret);
        form.add("response", token);
        if (remoteIp != null) {
            form.add("remoteip", remoteIp);
        }
        TurnstileResponse response;
        try {
            response = http.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TurnstileResponse.class);
        } catch (Exception e) {
            log.warn("Turnstile verification call failed: {}", e.toString());
            throw new ApiException(ErrorCode.CAPTCHA_FAILED, "Captcha verification failed");
        }
        if (response == null || !response.success()) {
            throw new ApiException(ErrorCode.CAPTCHA_FAILED, "Captcha verification failed");
        }
    }

    record TurnstileResponse(boolean success) {}
}
