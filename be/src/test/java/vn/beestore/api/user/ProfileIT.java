package vn.beestore.api.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static vn.beestore.api.support.AuthSupport.PASSWORD;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import vn.beestore.api.support.AuthSupport;
import vn.beestore.api.support.AuthSupport.Session;
import vn.beestore.api.support.IntegrationTest;
import vn.beestore.api.user.service.ProfileService;

/** AUTH-14 / AUTH-15 / SEC-14. */
class ProfileIT extends IntegrationTest {

    @Autowired
    ProfileService profiles;

    @Test
    void updateProfileFields() throws Exception {
        Session s = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(
                        patch("/api/v1/me")
                                .header("Authorization", s.bearer())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"fullName":"Nguyễn Văn A","phone":"+84901234567","preferredLocale":"en","preferredContact":"ZALO"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.data.phone").value("+84901234567"))
                .andExpect(jsonPath("$.data.preferredLocale").value("en"))
                .andExpect(jsonPath("$.data.preferredContact").value("ZALO"));

        mvc.perform(patch("/api/v1/me")
                        .header("Authorization", s.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"0901234567\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields[0].field").value("phone"));
    }

    @Test
    void emailChangeTakesEffectOnlyAfterConfirmation() throws Exception {
        Session s = AuthSupport.newCustomer(mvc, mails);
        String newEmail = AuthSupport.uniqueEmail("moved");

        mvc.perform(post("/api/v1/me/change-email")
                        .header("Authorization", s.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"%s\",\"password\":\"%s\"}".formatted(newEmail, PASSWORD)))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/me").header("Authorization", s.bearer()))
                .andExpect(jsonPath("$.data.email").value(s.email()));

        String token = mails.lastToken(newEmail, "change-email");
        mvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/me").header("Authorization", s.bearer()))
                .andExpect(jsonPath("$.data.email").value(newEmail));
    }

    @Test
    void emailChangeToAnExistingAccountIsRejected() throws Exception {
        Session a = AuthSupport.newCustomer(mvc, mails);
        Session b = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(post("/api/v1/me/change-email")
                        .header("Authorization", a.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newEmail\":\"%s\",\"password\":\"%s\"}".formatted(b.email(), PASSWORD)))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteAccountSoftDeletesThenAnonymizesAfterThirtyDays() throws Exception {
        Session s = AuthSupport.newCustomer(mvc, mails);
        mvc.perform(delete("/api/v1/me")
                        .header("Authorization", s.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"wrong-pass-1\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/v1/me")
                        .header("Authorization", s.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(s.email(), PASSWORD)))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh")
                        .header("X-Requested-With", "beestore")
                        .cookie(s.refreshCookie()))
                .andExpect(status().isUnauthorized());

        jdbc.update("update users set deleted_at = now() - interval '31 days' where email = ?", s.email());
        assertThat(profiles.anonymizeDeletedAccounts()).isGreaterThanOrEqualTo(1);
        Integer leftovers = jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, s.email());
        assertThat(leftovers).isZero();
    }
}
