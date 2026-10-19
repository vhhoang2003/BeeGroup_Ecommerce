package vn.beestore.api.auth.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import vn.beestore.api.common.error.ApiException;

/**
 * AUTH-03: 8-72 characters, at least one letter and one digit, not equal to the email, and not in the top-10k common
 * passwords (SecLists, Decision Log D-6).
 */
@Component
public class PasswordPolicy {

    static final int MIN_LENGTH = 8;
    static final int MAX_LENGTH = 72;

    private final Set<String> common;

    public PasswordPolicy() {
        this.common = load();
    }

    /** Throws {@code VALIDATION_ERROR} on {@code field} when the password is not acceptable. */
    public void check(String password, String email, String field) {
        String problem = problem(password, email);
        if (problem != null) {
            throw ApiException.validation(field, problem);
        }
    }

    String problem(String password, String email) {
        if (password == null || password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            return "Password must be 8-72 characters";
        }
        if (password.chars().noneMatch(Character::isLetter) || password.chars().noneMatch(Character::isDigit)) {
            return "Password must contain at least one letter and one digit";
        }
        if (email != null && password.equalsIgnoreCase(email.trim())) {
            return "Password must not be the same as the email";
        }
        if (common.contains(password.toLowerCase(Locale.ROOT))) {
            return "Password is too common";
        }
        return null;
    }

    private static Set<String> load() {
        Set<String> set = new HashSet<>();
        ClassPathResource resource = new ClassPathResource("security/common-passwords.txt");
        try (BufferedReader reader =
                new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    set.add(line.trim().toLowerCase(Locale.ROOT));
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Cannot load common password list", e);
        }
        return set;
    }
}
