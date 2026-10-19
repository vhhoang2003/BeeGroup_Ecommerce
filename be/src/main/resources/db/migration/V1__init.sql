-- README §7.2: users and authentication tokens.

CREATE TABLE users (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email                      varchar(254) NOT NULL,
    password_hash              varchar(255) NOT NULL,
    full_name                  varchar(100) NOT NULL,
    phone                      varchar(20),
    role                       varchar(20)  NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    status                     varchar(30)  NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DELETED')),
    preferred_locale           varchar(5)   NOT NULL DEFAULT 'vi',
    preferred_contact          varchar(20)  CHECK (preferred_contact IN ('PHONE', 'ZALO', 'EMAIL', 'MESSENGER')),
    email_verified_at          timestamptz,
    failed_login_count         int          NOT NULL DEFAULT 0,
    failed_login_window_start  timestamptz,
    locked_until               timestamptz,
    last_login_at              timestamptz,
    terms_accepted_at          timestamptz  NOT NULL,
    deleted_at                 timestamptz,
    created_at                 timestamptz  NOT NULL DEFAULT now(),
    updated_at                 timestamptz  NOT NULL DEFAULT now()
);

-- Emails are stored trimmed and lowercase (AUTH-02).
CREATE UNIQUE INDEX uq_users_email ON users (email);

CREATE TABLE refresh_tokens (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   char(64)    NOT NULL UNIQUE,
    family_id    uuid        NOT NULL,
    expires_at   timestamptz NOT NULL,
    revoked_at   timestamptz,
    replaced_by  uuid REFERENCES refresh_tokens (id),
    remember_me  boolean     NOT NULL DEFAULT false,
    user_agent   varchar(255),
    ip_address   inet,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);

CREATE TABLE verification_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        varchar(30) NOT NULL CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE')),
    token_hash  char(64)    NOT NULL UNIQUE,
    payload     jsonb,
    expires_at  timestamptz NOT NULL,
    used_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_tokens_user_type ON verification_tokens (user_id, type);
