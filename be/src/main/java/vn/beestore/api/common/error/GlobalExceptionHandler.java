package vn.beestore.api.common.error;

import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import vn.beestore.api.common.error.ApiException.FieldViolation;
import vn.beestore.api.common.web.TraceIdFilter;

/** Maps every exception to the README §8.2 error envelope. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(ex.code().status());
        if (ex.retryAfter() != null) {
            builder.header(
                    HttpHeaders.RETRY_AFTER,
                    String.valueOf(Math.max(1, ex.retryAfter().toSeconds())));
        }
        ex.headers().forEach(builder::header);
        return builder.body(ErrorResponse.of(ex.code(), ex.getMessage(), ex.fields(), traceId()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex) {
        List<FieldViolation> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldViolation(e.getField(), e.getDefaultMessage()))
                .toList();
        return validation(fields);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ErrorResponse> handleParamValidation(HandlerMethodValidationException ex) {
        List<FieldViolation> fields = ex.getParameterValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream()
                        .map(e -> new FieldViolation(r.getMethodParameter().getParameterName(), e.getDefaultMessage())))
                .toList();
        return validation(fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        List<FieldViolation> fields = ex.getConstraintViolations().stream()
                .map(v -> new FieldViolation(v.getPropertyPath().toString(), v.getMessage()))
                .toList();
        return validation(fields);
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class,
        MissingServletRequestPartException.class,
        MissingRequestHeaderException.class,
        MissingRequestCookieException.class
    })
    ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR, "Malformed request", List.of(), traceId()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ErrorResponse> handleUploadSize(MaxUploadSizeExceededException ex) {
        return error(ErrorCode.FILE_TOO_LARGE, "File exceeds the 5 MB limit");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex) {
        return error(ErrorCode.RESOURCE_NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorResponse> handleMethod(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR, ex.getMessage(), List.of(), traceId()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return error(ErrorCode.ACCESS_DENIED, "Access denied");
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return error(ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    /** The client went away mid-response (e.g. a cancelled image download); nothing can be sent back. */
    @ExceptionHandler(org.apache.catalina.connector.ClientAbortException.class)
    void handleClientAbort(org.apache.catalina.connector.ClientAbortException ex) {
        log.debug("Client aborted the request: {}", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(ErrorCode.INTERNAL_ERROR, "Internal server error");
    }

    private ResponseEntity<ErrorResponse> validation(List<FieldViolation> fields) {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(ErrorCode.VALIDATION_ERROR, "Validation failed", fields, traceId()));
    }

    private ResponseEntity<ErrorResponse> error(ErrorCode code, String message) {
        return ResponseEntity.status(code.status()).body(ErrorResponse.of(code, message, List.of(), traceId()));
    }

    private static String traceId() {
        return MDC.get(TraceIdFilter.MDC_KEY);
    }
}
