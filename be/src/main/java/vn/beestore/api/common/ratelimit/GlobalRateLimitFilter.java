package vn.beestore.api.common.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorResponse;
import vn.beestore.api.common.web.TraceIdFilter;

/** Global limit of 300 requests per minute per IP on the API (SEC-08). */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class GlobalRateLimitFilter extends OncePerRequestFilter {

    private final RateLimiter limiter;
    private final ObjectMapper mapper;

    public GlobalRateLimitFilter(RateLimiter limiter, ObjectMapper mapper) {
        this.limiter = limiter;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            limiter.check(RateLimitPolicy.GLOBAL_IP, request.getRemoteAddr());
        } catch (ApiException ex) {
            response.setStatus(ex.code().status().value());
            response.setHeader(
                    HttpHeaders.RETRY_AFTER,
                    String.valueOf(Math.max(1, ex.retryAfter().toSeconds())));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            mapper.writeValue(
                    response.getOutputStream(),
                    ErrorResponse.of(ex.code(), ex.getMessage(), List.of(), MDC.get(TraceIdFilter.MDC_KEY)));
            return;
        }
        chain.doFilter(request, response);
    }
}
