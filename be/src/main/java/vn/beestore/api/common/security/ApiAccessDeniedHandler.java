package vn.beestore.api.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.common.error.ErrorResponse;
import vn.beestore.api.common.web.TraceIdFilter;

/** 403 {@code ACCESS_DENIED}, e.g. a customer calling {@code /api/v1/admin/**}. */
@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper;

    public ApiAccessDeniedHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {
        response.setStatus(ErrorCode.ACCESS_DENIED.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(
                response.getOutputStream(),
                ErrorResponse.of(ErrorCode.ACCESS_DENIED, "Access denied", List.of(), MDC.get(TraceIdFilter.MDC_KEY)));
    }
}
