package vn.beestore.api.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/** SEC-08 limits. */
class RateLimiterTest {

    private final RateLimiter limiter = new RateLimiter(
            new AppProperties(null, null, null, null, null, null, null, new AppProperties.RateLimit(true), false));

    @Test
    void registerAllowsFivePerHourPerIp() {
        for (int i = 0; i < 5; i++) {
            limiter.check(RateLimitPolicy.REGISTER_IP, "10.0.0.1");
        }
        assertThatThrownBy(() -> limiter.check(RateLimitPolicy.REGISTER_IP, "10.0.0.1"))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.code()).isEqualTo(ErrorCode.RATE_LIMITED);
                    assertThat(ex.retryAfter()).isPositive();
                });
        // Other keys and other policies have their own buckets.
        limiter.check(RateLimitPolicy.REGISTER_IP, "10.0.0.2");
        limiter.check(RateLimitPolicy.LOGIN_IP, "10.0.0.1");
    }

    @Test
    void keysAreCaseInsensitive() {
        for (int i = 0; i < 3; i++) {
            limiter.check(RateLimitPolicy.FORGOT_PASSWORD_EMAIL, "A@Example.com");
        }
        assertThatThrownBy(() -> limiter.check(RateLimitPolicy.FORGOT_PASSWORD_EMAIL, "a@example.com"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void disabledLimiterNeverThrows() {
        RateLimiter off = new RateLimiter(
                new AppProperties(null, null, null, null, null, null, null, new AppProperties.RateLimit(false), false));
        for (int i = 0; i < 50; i++) {
            off.check(RateLimitPolicy.REGISTER_IP, "10.0.0.9");
        }
    }

    @Test
    void policiesMatchTheSpecification() {
        assertThat(RateLimitPolicy.LOGIN_IP.capacity()).isEqualTo(20);
        assertThat(RateLimitPolicy.LOGIN_IP.period()).hasMinutes(15);
        assertThat(RateLimitPolicy.REGISTER_IP.capacity()).isEqualTo(5);
        assertThat(RateLimitPolicy.FORGOT_PASSWORD_EMAIL.capacity()).isEqualTo(3);
        assertThat(RateLimitPolicy.INQUIRY_IP.capacity()).isEqualTo(5);
        assertThat(RateLimitPolicy.GLOBAL_IP.capacity()).isEqualTo(300);
        assertThat(RateLimitPolicy.GLOBAL_IP.period()).hasMinutes(1);
    }
}
