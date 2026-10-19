-- README §7.2: audit log of admin actions (ADM-08, SEC-15).

CREATE TABLE audit_logs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     uuid REFERENCES users (id) ON DELETE SET NULL,
    action       varchar(60) NOT NULL,
    entity_type  varchar(40) NOT NULL,
    entity_id    varchar(64),
    before       jsonb,
    after        jsonb,
    ip_address   inet,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
