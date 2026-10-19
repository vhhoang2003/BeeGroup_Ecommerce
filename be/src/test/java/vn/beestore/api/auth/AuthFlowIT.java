package vn.beestore.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static vn.beestore.api.support.AuthSupport.PASSWORD;

import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.AuthSupport.Session;
import vn.beestore.api.support.IntegrationTest;

/** README §15 "critical auth test cases" plus the rest of AUTH-01..13. */
class AuthFlowIT extends IntegrationTest {

    @Autowired
    JwtEncoder jwtEncoder;

    @Autowired
    PasswordEncoder passwordEncoder;

    // --- AUTH-01 / AUTH-02 / AUTH-03 -------------------------------------------------------------------------

    @Test
    void duplicateEmailIsRejectedCaseInsensitively() throws Exception {
        String email = AuthSupport.uniqueEmail("dup");
        AuthSupport.register(mvc, email);

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("  " + email.toUpperCase() + " ", PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.error.traceId").isNotEmpty());

        String stored = jdbc.queryForObject("select email from users where email = ?", String.class, email);
        assertThat(stored).isEqualTo(email);
    }

    @Test
    void weakPasswordsAreRejected() throws Exception {
        for (String weak : List.of("short1", "12345678901", "onlyletters", "qwerty123")) {
            mvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(registerBody(AuthSupport.uniqueEmail("weak"), weak)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.error.fields[0].field").value("password"));
        }
    }

    @Test
    void registrationRequiresTermsAcceptance() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                        {"fullName":"A","email":"%s","password":"%s","acceptTerms":false}
                        """
                                        .formatted(AuthSupport.uniqueEmail("terms"), PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("acceptTerms"));
    }

    // --- AUTH-04 / AUTH-05 / AUTH-06 -------------------------------------------------------------------------

    @Test
    void unverifiedLoginIsBlockedAndVerificationEmailIsDelivered() throws Exception {
        String email = AuthSupport.uniqueEmail("unverified");
        AuthSupport.register(mvc, email);

        mvc.perform(loginRequest(email, PASSWORD))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));

        await().atMost(Duration.ofSeconds(10)).until(() -> received(email) > 0);
    }

    @Test
    void expiredVerificationLinkIsRejected() throws Exception {
        String email = AuthSupport.uniqueEmail("expired");
        AuthSupport.register(mvc, email);
        String token = mails.lastToken(email, "verify-email");
        jdbc.update(
                "update verification_tokens set expires_at = now() - interval '1 minute' where user_id = "
                        + "(select id from users where email = ?)",
                email);

        mvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("TOKEN_INVALID_OR_EXPIRED"));
    }

    @Test
    void verificationLinkIsSingleUseAndResendInvalidatesTheOldOne() throws Exception {
        String email = AuthSupport.uniqueEmail("resend");
        AuthSupport.register(mvc, email);
        String first = mails.lastToken(email, "verify-email");

        mvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted());
        String second = mails.lastToken(email, "verify-email");
        assertThat(second).isNotEqualTo(first);

        verifyToken(first).andExpect(status().isBadRequest());
        verifyToken(second).andExpect(status().isOk());
        verifyToken(second).andExpect(status().isBadRequest());
    }

    @Test
    void loginSetsSecureRefreshCookieAndAccessTokenWorks() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);

        assertThat(session.refreshCookie().isHttpOnly()).isTrue();
        assertThat(session.refreshCookie().getPath()).isEqualTo("/api/v1/auth");
        assertThat(session.refreshCookie().getAttribute("SameSite")).isEqualTo("Strict");

        mvc.perform(get("/api/v1/me").header("Authorization", session.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(session.email()))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    // --- AUTH-07 / AUTH-08 -----------------------------------------------------------------------------------

    @Test
    void genericErrorForUnknownEmailAndWrongPassword() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(loginRequest(AuthSupport.uniqueEmail("nobody"), PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        mvc.perform(loginRequest(session.email(), "Wrong-password-1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void accountLocksAfterFiveFailuresWithinFifteenMinutes() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        for (int i = 0; i < 5; i++) {
            mvc.perform(loginRequest(session.email(), "Wrong-password-1")).andExpect(status().isUnauthorized());
        }
        mvc.perform(loginRequest(session.email(), PASSWORD))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error.code").value("ACCOUNT_LOCKED"))
                .andExpect(header().exists("Retry-After"));

        // Lock expires after 15 minutes.
        jdbc.update("update users set locked_until = now() - interval '1 second' where email = ?", session.email());
        mvc.perform(loginRequest(session.email(), PASSWORD)).andExpect(status().isOk());
    }

    @Test
    void failuresOutsideTheWindowDoNotAccumulate() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        for (int i = 0; i < 4; i++) {
            mvc.perform(loginRequest(session.email(), "Wrong-password-1")).andExpect(status().isUnauthorized());
        }
        jdbc.update(
                "update users set failed_login_window_start = now() - interval '16 minutes' where email = ?",
                session.email());
        mvc.perform(loginRequest(session.email(), "Wrong-password-1")).andExpect(status().isUnauthorized());
        mvc.perform(loginRequest(session.email(), PASSWORD)).andExpect(status().isOk());
    }

    // --- AUTH-09 / AUTH-10 / SEC-06 ----------------------------------------------------------------------------

    @Test
    void refreshRotatesTheTokenAndReuseRevokesTheFamily() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        Cookie first = session.refreshCookie();

        MvcResult rotated = mvc.perform(refreshRequest(first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();
        Cookie second = rotated.getResponse().getCookie("refresh_token");
        assertThat(second.getValue()).isNotEqualTo(first.getValue());

        mvc.perform(refreshRequest(first))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_TOKEN_REUSED"));
        // The successor was revoked together with the family.
        mvc.perform(refreshRequest(second))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_TOKEN_INVALID"));
    }

    @Test
    void refreshRequiresTheCustomHeaderAndACookie() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/auth/refresh").cookie(session.refreshCookie()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/refresh").header("X-Requested-With", "beestore"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_TOKEN_INVALID"));
    }

    @Test
    void logoutRevokesTheSessionAndClearsTheCookie() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        MvcResult result = mvc.perform(post("/api/v1/auth/logout")
                        .header("X-Requested-With", "beestore")
                        .cookie(session.refreshCookie()))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(result.getResponse().getCookie("refresh_token").getMaxAge()).isZero();
        mvc.perform(refreshRequest(session.refreshCookie()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_TOKEN_INVALID"));
    }

    @Test
    void logoutAllRevokesEverySession() throws Exception {
        Session a = AuthSupport.newCustomer(mvc, mails);
        Session b = AuthSupport.login(mvc, a.email(), PASSWORD);
        mvc.perform(post("/api/v1/auth/logout-all").header("Authorization", a.bearer()))
                .andExpect(status().isNoContent());
        mvc.perform(refreshRequest(a.refreshCookie())).andExpect(status().isUnauthorized());
        mvc.perform(refreshRequest(b.refreshCookie())).andExpect(status().isUnauthorized());
    }

    @Test
    void rememberMeKeepsThirtyDayTtlAcrossRotation() throws Exception {
        Session plain = AuthSupport.newCustomer(mvc, mails);
        MvcResult login = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\",\"rememberMe\":true}"
                                .formatted(plain.email(), PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        Cookie remembered = login.getResponse().getCookie("refresh_token");
        assertThat(remembered.getMaxAge()).isEqualTo((int) Duration.ofDays(30).toSeconds());
        assertThat(plain.refreshCookie().getMaxAge())
                .isEqualTo((int) Duration.ofDays(7).toSeconds());

        Cookie rotated = mvc.perform(refreshRequest(remembered))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getCookie("refresh_token");
        assertThat(rotated.getMaxAge()).isEqualTo((int) Duration.ofDays(30).toSeconds());
    }

    // --- AUTH-11 / AUTH-12 / AUTH-13 ---------------------------------------------------------------------------

    @Test
    void resetPasswordRevokesSessionsAndIsSingleUse() throws Exception {
        Session session = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + session.email() + "\"}"))
                .andExpect(status().isAccepted());
        String token = mails.lastToken(session.email(), "reset-password");

        String body = "{\"token\":\"%s\",\"newPassword\":\"Brand-new-2026\"}".formatted(token);
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("TOKEN_INVALID_OR_EXPIRED"));

        mvc.perform(refreshRequest(session.refreshCookie())).andExpect(status().isUnauthorized());
        mvc.perform(loginRequest(session.email(), PASSWORD)).andExpect(status().isUnauthorized());
        mvc.perform(loginRequest(session.email(), "Brand-new-2026")).andExpect(status().isOk());
        assertThat(mails.to(session.email())).anyMatch(e -> e.template().equals("password-changed"));
    }

    @Test
    void forgotPasswordAnswersTheSameForUnknownEmails() throws Exception {
        mvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + AuthSupport.uniqueEmail("ghost") + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("If an account exists, we sent an email"));
    }

    @Test
    void changePasswordKeepsCurrentSessionAndRevokesOthers() throws Exception {
        Session current = AuthSupport.newCustomer(mvc, mails);
        Session other = AuthSupport.login(mvc, current.email(), PASSWORD);

        mvc.perform(post("/api/v1/me/change-password")
                        .header("Authorization", current.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Wrong-1234\",\"newPassword\":\"Changed-2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("currentPassword"));

        mvc.perform(post("/api/v1/me/change-password")
                        .header("Authorization", current.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"%s\",\"newPassword\":\"Changed-2026\"}".formatted(PASSWORD)))
                .andExpect(status().isOk());

        mvc.perform(refreshRequest(current.refreshCookie())).andExpect(status().isOk());
        mvc.perform(refreshRequest(other.refreshCookie())).andExpect(status().isUnauthorized());
    }

    // --- Token checks, roles (SEC-03, SEC-15) ----------------------------------------------------------------

    @Test
    void expiredAccessTokenReturnsTokenExpired() throws Exception {
        Instant past = Instant.now().minus(Duration.ofMinutes(20));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(UUID.randomUUID().toString())
                .claim("roles", List.of("CUSTOMER"))
                .issuedAt(past)
                .expiresAt(past.plus(Duration.ofMinutes(15)))
                .id(UUID.randomUUID().toString())
                .build();
        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("TOKEN_EXPIRED"));
    }

    @Test
    void anonymousAndCustomerCannotReachAdminEndpoints() throws Exception {
        mvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

        Session customer = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(get("/api/v1/admin/users").header("Authorization", customer.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    void adminRoleIsCarriedInTheAccessToken() throws Exception {
        Session admin = AuthSupport.newAdmin(mvc, jdbc, passwordEncoder.encode(PASSWORD));
        mvc.perform(get("/api/v1/me").header("Authorization", admin.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    // --- helpers -----------------------------------------------------------------------------------------------

    private static String registerBody(String email, String password) {
        return """
                {"fullName":"Test User","email":"%s","password":"%s","acceptTerms":true}
                """
                .formatted(email, password);
    }

    private static MockHttpServletRequestBuilder loginRequest(String email, String password) {
        return post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private static MockHttpServletRequestBuilder refreshRequest(Cookie cookie) {
        return post("/api/v1/auth/refresh")
                .header("X-Requested-With", "beestore")
                .cookie(cookie);
    }

    private org.springframework.test.web.servlet.ResultActions verifyToken(String token) throws Exception {
        return mvc.perform(post("/api/v1/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"" + token + "\"}"));
    }

    private static long received(String email) {
        return java.util.Arrays.stream(GREEN_MAIL.getReceivedMessages())
                .filter(m -> {
                    try {
                        return ((MimeMessage) m)
                                .getAllRecipients()[0]
                                .toString()
                                .equalsIgnoreCase(email);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .count();
    }
}
