package vn.beestore.api.common.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/**
 * In-memory Bucket4j limiter (SEC-08). Fine for the single-instance v1 deployment; README §10 notes that scaling out
 * requires a shared store (Redis).
 */
@Component
public class RateLimiter {

    private final Map<String, Entry> buckets = new ConcurrentHashMap<>();
    private final boolean enabled;

    public RateLimiter(AppProperties props) {
        this.enabled = props.rateLimit() == null || props.rateLimit().enabled();
    }

    /** Consumes one token for {@code key} under {@code policy}, or throws 429 {@code RATE_LIMITED}. */
    public void check(RateLimitPolicy policy, String key) {
        if (!enabled || key == null) {
            return;
        }
        ConsumptionProbe probe = bucket(policy, key).tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            throw ApiException.withRetryAfter(
                    ErrorCode.RATE_LIMITED,
                    "Too many requests, please try again later",
                    Duration.ofNanos(probe.getNanosToWaitForRefill()));
        }
    }

    private Bucket bucket(RateLimitPolicy policy, String key) {
        Entry entry = buckets.compute(policy.name() + ":" + key.toLowerCase(), (k, existing) -> {
            Entry e = existing != null ? existing : new Entry(newBucket(policy), policy.period());
            e.touch();
            return e;
        });
        return entry.bucket;
    }

    private static Bucket newBucket(RateLimitPolicy policy) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(policy.capacity())
                        .refillIntervally(policy.capacity(), policy.period())
                        .build())
                .build();
    }

    /** Drops buckets idle for longer than their period so the map does not grow without bound. */
    @Scheduled(fixedDelay = 600_000)
    void evictIdle() {
        long now = System.nanoTime();
        buckets.values().removeIf(e -> now - e.lastAccess > e.period.toNanos());
    }

    private static final class Entry {
        private final Bucket bucket;
        private final Duration period;
        private volatile long lastAccess;

        Entry(Bucket bucket, Duration period) {
            this.bucket = bucket;
            this.period = period;
        }

        void touch() {
            lastAccess = System.nanoTime();
        }
    }
}
