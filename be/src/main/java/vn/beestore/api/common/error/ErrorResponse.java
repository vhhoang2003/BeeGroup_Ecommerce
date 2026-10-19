package vn.beestore.api.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import vn.beestore.api.common.error.ApiException.FieldViolation;

/** Error envelope (README §8.2). */
public record ErrorResponse(boolean success, String message, ErrorBody error, Instant timestamp) {

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public record ErrorBody(String code, List<FieldViolation> fields, String traceId) {}

    public static ErrorResponse of(ErrorCode code, String message, List<FieldViolation> fields, String traceId) {
        return new ErrorResponse(false, message, new ErrorBody(code.name(), fields, traceId), Instant.now());
    }
}
