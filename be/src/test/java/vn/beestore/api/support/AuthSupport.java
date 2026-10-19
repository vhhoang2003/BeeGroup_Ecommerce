package vn.beestore.api.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** Register / verify / login helpers shared by integration tests. */
public final class AuthSupport {

    public static final String PASSWORD = "Beestore2026x";

    private AuthSupport() {}

    public record Session(String email, String accessToken, Cookie refreshCookie) {
        public String bearer() {
            return "Bearer " + accessToken;
        }
    }

    public static String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    public static void register(MockMvc mvc, String email) throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {"fullName":"Test User","email":"%s","password":"%s","acceptTerms":true,"locale":"vi"}
                                """
                                        .formatted(email, PASSWORD)))
                .andExpect(status().isCreated());
    }

    public static void verify(MockMvc mvc, MailCapture mails, String email) throws Exception {
        String token = mails.lastToken(email, "verify-email");
        mvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk());
    }

    public static Session login(MockMvc mvc, String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        String access = JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
        return new Session(email, access, result.getResponse().getCookie("refresh_token"));
    }

    /** Registers, verifies and logs in a new customer. */
    public static Session newCustomer(MockMvc mvc, MailCapture mails) throws Exception {
        String email = uniqueEmail("customer");
        register(mvc, email);
        verify(mvc, mails, email);
        return login(mvc, email, PASSWORD);
    }

    /** Creates an active admin directly in the database and logs in. */
    public static Session newAdmin(MockMvc mvc, org.springframework.jdbc.core.JdbcTemplate jdbc, String passwordHash)
            throws Exception {
        String email = uniqueEmail("admin");
        jdbc.update(
                """
                insert into users (email, password_hash, full_name, role, status, email_verified_at, terms_accepted_at)
                values (?, ?, 'Admin', 'ADMIN', 'ACTIVE', now(), now())
                """,
                email,
                passwordHash);
        return login(mvc, email, PASSWORD);
    }
}
