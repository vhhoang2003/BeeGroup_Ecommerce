package vn.beestore.api.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.common.error.ErrorResponse;
import vn.beestore.api.common.web.TraceIdFilter;

/** 401 in the README §8.2 envelope; an expired access token yields {@code TOKEN_EXPIRED} so the FE refreshes. */
@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public ApiAuthenticationEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        String message = ex.getMessage() == null ? "" : ex.getMessage();
        boolean expired = message.toLowerCase().contains("expired");
        ErrorCode code = expired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.UNAUTHORIZED;
        write(response, code, expired ? "Access token expired" : "Authentication required");
    }

    private void write(HttpServletResponse response, ErrorCode code, String message) throws IOException {
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(
                response.getOutputStream(), ErrorResponse.of(code, message, List.of(), MDC.get(TraceIdFilter.MDC_KEY)));
    }
}
