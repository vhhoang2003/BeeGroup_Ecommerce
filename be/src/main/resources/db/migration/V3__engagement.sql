-- README §7.2: inquiries (quote requests / contact messages) and wishlist.

-- Provides NNNNNN in the INQ-YYYY-NNNNNN inquiry code (Decision Log D-3).
CREATE SEQUENCE inquiry_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE inquiries (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code               varchar(20)  NOT NULL UNIQUE,
    user_id            uuid REFERENCES users (id) ON DELETE SET NULL,
    product_id         uuid REFERENCES products (id) ON DELETE SET NULL,
    type               varchar(20)  NOT NULL CHECK (type IN ('PRODUCT', 'GENERAL')),
    product_snapshot   jsonb,
    quantity           int          NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    full_name          varchar(100) NOT NULL,
    email              varchar(254) NOT NULL,
    phone              varchar(20),
    preferred_contact  varchar(20)  CHECK (preferred_contact IN ('PHONE', 'ZALO', 'EMAIL', 'MESSENGER')),
    subject            varchar(200),
    message            text         CHECK (message IS NULL OR char_length(message) <= 2000),
    status             varchar(20)  NOT NULL DEFAULT 'NEW'
                       CHECK (status IN ('NEW', 'CONTACTED', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST', 'SPAM')),
    assignee_id        uuid REFERENCES users (id) ON DELETE SET NULL,
    locale             varchar(5)   NOT NULL DEFAULT 'vi',
    ip_address         inet,
    created_at         timestamptz  NOT NULL DEFAULT now(),
    updated_at         timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_status ON inquiries (status, created_at DESC);
CREATE INDEX idx_inquiries_user ON inquiries (user_id, created_at DESC);

CREATE TABLE inquiry_events (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id   uuid        NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
    actor_id     uuid REFERENCES users (id) ON DELETE SET NULL,
    from_status  varchar(20),
    to_status    varchar(20),
    note         text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_events_inquiry ON inquiry_events (inquiry_id, created_at);

CREATE TABLE wishlist_items (
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id  uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);
