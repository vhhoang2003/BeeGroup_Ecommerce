package vn.beestore.api.user.dto;

import java.time.Instant;
import java.util.UUID;
import vn.beestore.api.user.domain.ContactChannel;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.UserStatus;

public record UserDto(
        UUID id,
        String email,
        String fullName,
        String phone,
        Role role,
        UserStatus status,
        String preferredLocale,
        ContactChannel preferredContact,
        Instant emailVerifiedAt,
        Instant lastLoginAt,
        Instant createdAt) {}
