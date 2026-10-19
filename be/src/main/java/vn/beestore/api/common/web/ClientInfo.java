package vn.beestore.api.common.web;

import jakarta.servlet.http.HttpServletRequest;

/** Request metadata captured for refresh tokens, inquiries and audit logs. */
public record ClientInfo(String ip, String userAgent) {

    private static final int MAX_USER_AGENT = 255;

    /**
     * {@code server.forward-headers-strategy=framework} already resolves {@code X-Forwarded-For} from the trusted
     * reverse proxy into {@link HttpServletRequest#getRemoteAddr()}.
     */
    public static ClientInfo from(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > MAX_USER_AGENT) {
            ua = ua.substring(0, MAX_USER_AGENT);
        }
        return new ClientInfo(request.getRemoteAddr(), ua);
    }
}
