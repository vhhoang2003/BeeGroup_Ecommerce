package vn.beestore.api.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** AUTH-03. */
class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void acceptsAStrongPassword() {
        assertThat(policy.problem("Beestore2026x", "a@b.vn")).isNull();
    }

    @Test
    void enforcesLengthBounds() {
        assertThat(policy.problem("Ab1defg", "a@b.vn")).contains("8-72");
        assertThat(policy.problem("A1" + "x".repeat(71), "a@b.vn")).contains("8-72");
        assertThat(policy.problem("A1" + "x".repeat(70), "a@b.vn")).isNull();
    }

    @Test
    void requiresALetterAndADigit() {
        assertThat(policy.problem("1234567890", "a@b.vn")).contains("letter");
        assertThat(policy.problem("abcdefghij", "a@b.vn")).contains("digit");
    }

    @Test
    void rejectsTheEmailAsPassword() {
        assertThat(policy.problem("user1@shop.vn", "User1@Shop.vn")).contains("email");
    }

    @Test
    void rejectsCommonPasswordsCaseInsensitively() {
        assertThat(policy.problem("Password1", "a@b.vn")).contains("common");
        assertThat(policy.problem("qwerty123", "a@b.vn")).contains("common");
    }
}
