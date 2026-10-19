package vn.beestore.api.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.support.IntegrationTest;
import vn.beestore.api.user.repository.UserRepository;
import vn.beestore.api.user.service.AdminBootstrap;

/** AUTH-17: the first admin comes from environment variables, once. */
class AdminBootstrapIT extends IntegrationTest {

    @Autowired
    UserRepository users;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    AppProperties props;

    @Test
    void createsAdminOnlyWhenNoneExists() {
        jdbc.update("delete from users where role = 'ADMIN'");
        AppProperties withAdmin = new AppProperties(
                props.security(),
                props.mail(),
                props.siteUrl(),
                props.storage(),
                props.catalogSourcePath(),
                props.revalidate(),
                new AppProperties.BootstrapAdmin(" Root@BeeStore.vn ", "Admin-pass-2026"),
                props.rateLimit(),
                props.importEndpointEnabled());
        AdminBootstrap bootstrap = new AdminBootstrap(users, encoder, withAdmin, Clock.systemUTC());

        assertThat(bootstrap.createIfMissing()).isTrue();
        assertThat(bootstrap.createIfMissing()).isFalse();

        String role = jdbc.queryForObject("select role from users where email = 'root@beestore.vn'", String.class);
        assertThat(role).isEqualTo("ADMIN");
    }
}
