-- README §7.2 / §7.3: catalog tables, full-text and trigram search.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        varchar(80)  NOT NULL UNIQUE,
    name        jsonb        NOT NULL,
    image_url   varchar(500),
    sort_order  int          NOT NULL DEFAULT 0,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE sub_categories (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id  uuid        NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    slug         varchar(80) NOT NULL,
    name         jsonb       NOT NULL,
    sort_order   int         NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_sub_categories_slug UNIQUE (category_id, slug)
);

CREATE TABLE products (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id        varchar(20),
    slug             varchar(120) NOT NULL UNIQUE,
    sku              varchar(50) UNIQUE,
    brand            varchar(60)  NOT NULL,
    category_id      uuid         NOT NULL REFERENCES categories (id),
    sub_category_id  uuid REFERENCES sub_categories (id),
    price            bigint CHECK (price IS NULL OR price >= 0),
    stock_status     varchar(20)  NOT NULL DEFAULT 'IN_STOCK'
                     CHECK (stock_status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER')),
    status           varchar(20)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    is_featured      boolean      NOT NULL DEFAULT false,
    specs            jsonb        NOT NULL DEFAULT '[]'::jsonb,
    sources          jsonb        NOT NULL DEFAULT '[]'::jsonb,
    view_count       bigint       NOT NULL DEFAULT 0,
    search_vector    tsvector,
    published_at     timestamptz,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_search ON products USING GIN (search_vector);
CREATE INDEX idx_products_specs ON products USING GIN (specs jsonb_path_ops);
CREATE INDEX idx_products_listing ON products (status, category_id, sub_category_id, price);

CREATE TABLE product_translations (
    product_id         uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    locale             varchar(5)   NOT NULL CHECK (locale IN ('vi', 'en', 'zh')),
    name               varchar(200) NOT NULL,
    short_description  varchar(500),
    description        text,
    highlights         jsonb        NOT NULL DEFAULT '[]'::jsonb,
    use_cases          jsonb        NOT NULL DEFAULT '[]'::jsonb,
    notes              jsonb        NOT NULL DEFAULT '[]'::jsonb,
    meta_title         varchar(200),
    meta_description   varchar(500),
    created_at         timestamptz  NOT NULL DEFAULT now(),
    updated_at         timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, locale)
);

CREATE INDEX idx_product_tr_name_trgm ON product_translations USING GIN (name gin_trgm_ops);

CREATE TABLE product_images (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    storage_key  varchar(500) NOT NULL,
    alt          jsonb        NOT NULL DEFAULT '{}'::jsonb,
    credit       text,
    sort_order   int          NOT NULL DEFAULT 0,
    width        int,
    height       int,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images (product_id, sort_order);
