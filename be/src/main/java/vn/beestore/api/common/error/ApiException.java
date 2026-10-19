package vn.beestore.api.common.error;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Business error mapped to the README §8.2 error envelope by {@link GlobalExceptionHandler}. */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final transient List<FieldViolation> fields;
    /** Sent as {@code Retry-After} for {@link ErrorCode#RATE_LIMITED} / {@link ErrorCode#ACCOUNT_LOCKED}. */
    private final Duration retryAfter;
    /** Extra response headers, e.g. a {@code Set-Cookie} that clears a dead refresh cookie. */
    private final Map<String, String> headers = new LinkedHashMap<>();

    public ApiException(ErrorCode code, String message) {
        this(code, message, List.of(), null);
    }

    public ApiException(ErrorCode code, String message, List<FieldViolation> fields, Duration retryAfter) {
        super(message);
        this.code = code;
        this.fields = fields;
        this.retryAfter = retryAfter;
    }

    public static ApiException notFound(String what) {
        return new ApiException(ErrorCode.RESOURCE_NOT_FOUND, what + " not found");
    }

    public static ApiException validation(String field, String message) {
        return new ApiException(
                ErrorCode.VALIDATION_ERROR, "Validation failed", List.of(new FieldViolation(field, message)), null);
    }

    public static ApiException withRetryAfter(ErrorCode code, String message, Duration retryAfter) {
        return new ApiException(code, message, List.of(), retryAfter);
    }

    public ApiException withHeader(String name, String value) {
        headers.put(name, value);
        return this;
    }

    public Map<String, String> headers() {
        return headers;
    }

    public ErrorCode code() {
        return code;
    }

    public List<FieldViolation> fields() {
        return fields;
    }

    public Duration retryAfter() {
        return retryAfter;
    }

    public record FieldViolation(String field, String message) {}
}
