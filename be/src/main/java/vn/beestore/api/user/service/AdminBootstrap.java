package vn.beestore.api.user.service;

import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.auth.service.AuthService;
import vn.beestore.api.common.config.AppProperties;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.repository.UserRepository;

/**
 * Creates the first admin from {@code ADMIN_BOOTSTRAP_EMAIL} / {@code ADMIN_BOOTSTRAP_PASSWORD} when no admin exists
 * yet (AUTH-17). There is no public admin sign-up.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;
    private final Clock clock;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder, AppProperties props, Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        createIfMissing();
    }

    @Transactional
    public boolean createIfMissing() {
        AppProperties.BootstrapAdmin cfg = props.bootstrapAdmin();
        if (cfg == null || isBlank(cfg.email()) || isBlank(cfg.password()) || users.existsByRole(Role.ADMIN)) {
            return false;
        }
        String email = AuthService.normalizeEmail(cfg.email());
        if (users.existsByEmail(email)) {
            log.warn("Bootstrap admin email is already used by a non-admin account; skipping");
            return false;
        }
        User admin = new User();
        admin.setEmail(email);
        admin.setFullName("Administrator");
        admin.setPasswordHash(passwordEncoder.encode(cfg.password()));
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerifiedAt(clock.instant());
        admin.setTermsAcceptedAt(clock.instant());
        users.save(admin);
        log.info("Bootstrap admin account created");
        return true;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
