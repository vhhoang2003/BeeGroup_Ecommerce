package vn.beestore.api.common.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.beestore.api.auth.service.JwtService;
import vn.beestore.api.common.config.AppProperties;

/**
 * Stateless API secured by Bearer JWTs (AD-3). CSRF protection is unnecessary for Bearer endpoints; the cookie-based
 * {@code /auth/refresh} and {@code /auth/logout} rely on {@code SameSite=Strict} plus the {@code X-Requested-With}
 * header check in the auth controller (SEC-06).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final int MIN_SECRET_BYTES = 32; // HS256 needs >= 256-bit keys (SEC-03)

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http, ApiAuthenticationEntryPoint entryPoint, ApiAccessDeniedHandler deniedHandler)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(f -> f.disable())
                .httpBasic(b -> b.disable())
                .authorizeHttpRequests(auth -> auth.requestMatchers("/api/v1/auth/logout-all")
                        .authenticated()
                        .requestMatchers("/api/v1/auth/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categories/**", "/api/v1/products/**")
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.POST, "/api/v1/products/*/views", "/api/v1/inquiries", "/api/v1/contact")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/uploads/**", "/actuator/health/**", "/actuator/health")
                        .permitAll()
                        .requestMatchers("/api/v1/docs/**", "/v3/api-docs/**", "/swagger-ui/**")
                        .permitAll()
                        .requestMatchers("/error")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(
                        oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                                .authenticationEntryPoint(entryPoint)
                                .accessDeniedHandler(deniedHandler))
                .exceptionHandling(e -> e.authenticationEntryPoint(entryPoint).accessDeniedHandler(deniedHandler))
                .headers(h -> h.contentTypeOptions(c -> {}).frameOptions(f -> f.deny()));
        return http.build();
    }

    /** Maps the {@code roles} claim to {@code ROLE_*} authorities. */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<String> roles = jwt.getClaimAsStringList(JwtService.ROLES_CLAIM);
            return roles == null
                    ? List.<GrantedAuthority>of()
                    : roles.stream()
                            .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
                            .toList();
        });
        return converter;
    }

    @Bean
    SecretKey jwtSecretKey(AppProperties props) {
        byte[] secret = props.security().jwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes (256 bits)");
        }
        return new SecretKeySpec(secret, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    /** Argon2id (SEC-02). */
    @Bean
    PasswordEncoder passwordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    /** Only the FE origin(s); credentials (cookies) only for {@code /api/v1/auth/**} (SEC-07). */
    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        List<String> origins = props.security().corsAllowedOrigins();
        List<String> methods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        List<String> headers = List.of("Authorization", "Content-Type", "X-Requested-With", "X-Trace-Id");

        CorsConfiguration auth = new CorsConfiguration();
        auth.setAllowedOrigins(origins);
        auth.setAllowedMethods(methods);
        auth.setAllowedHeaders(headers);
        auth.setExposedHeaders(List.of("X-Trace-Id", "Retry-After"));
        auth.setAllowCredentials(true);

        CorsConfiguration api = new CorsConfiguration(auth);
        api.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/v1/auth/**", auth);
        source.registerCorsConfiguration("/api/**", api);
        source.registerCorsConfiguration("/uploads/**", api);
        return source;
    }
}
