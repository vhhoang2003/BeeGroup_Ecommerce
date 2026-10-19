package vn.beestore.api.common.ratelimit;

import java.time.Duration;

/** Limits from SEC-08 (plus AUTH-05 for verification resends). */
public enum RateLimitPolicy {
    GLOBAL_IP(300, Duration.ofMinutes(1)),
    LOGIN_IP(20, Duration.ofMinutes(15)),
    REGISTER_IP(5, Duration.ofHours(1)),
    FORGOT_PASSWORD_EMAIL(3, Duration.ofHours(1)),
    RESEND_VERIFICATION_EMAIL(3, Duration.ofHours(1)),
    INQUIRY_IP(5, Duration.ofHours(1));

    private final long capacity;
    private final Duration period;

    RateLimitPolicy(long capacity, Duration period) {
        this.capacity = capacity;
        this.period = period;
    }

    public long capacity() {
        return capacity;
    }

    public Duration period() {
        return period;
    }
}
