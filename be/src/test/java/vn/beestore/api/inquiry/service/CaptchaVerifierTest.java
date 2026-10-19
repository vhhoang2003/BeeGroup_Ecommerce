package vn.beestore.api.inquiry.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.common.error.ApiException;

/** ENG-02: Turnstile verification. */
class CaptchaVerifierTest {

    private static AppProperties props(String secret) {
        return new AppProperties(
                new AppProperties.Security(null, null, null, null, false, null, secret),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false);
    }

    @Test
    void verifiesTokenWithCloudflare() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(CaptchaVerifier.VERIFY_URL))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("response=good")))
                .andRespond(withSuccess("{\"success\":true}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(CaptchaVerifier.VERIFY_URL))
                .andRespond(withSuccess("{\"success\":false}", MediaType.APPLICATION_JSON));

        CaptchaVerifier verifier = new CaptchaVerifier(builder, props("secret"), new MockEnvironment());
        assertThatCode(() -> verifier.verify("good", "1.2.3.4")).doesNotThrowAnyException();
        assertThatThrownBy(() -> verifier.verify("bad", "1.2.3.4")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> verifier.verify("", "1.2.3.4")).isInstanceOf(ApiException.class);
        server.verify();
    }

    @Test
    void missingSecretSkipsOutsideProductionAndFailsClosedInProduction() {
        assertThatCode(() ->
                        new CaptchaVerifier(RestClient.builder(), props(""), new MockEnvironment()).verify(null, null))
                .doesNotThrowAnyException();

        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");
        assertThatThrownBy(() -> new CaptchaVerifier(RestClient.builder(), props(""), prod).verify("x", null))
                .isInstanceOf(ApiException.class);
    }
}
