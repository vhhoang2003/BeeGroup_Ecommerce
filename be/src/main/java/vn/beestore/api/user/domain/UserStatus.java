package vn.beestore.api.user.domain;

public enum UserStatus {
    PENDING_VERIFICATION,
    ACTIVE,
    /** Locked by an admin (ADM-06). Temporary brute-force lockouts use {@code locked_until} instead. */
    LOCKED,
    DELETED
}
