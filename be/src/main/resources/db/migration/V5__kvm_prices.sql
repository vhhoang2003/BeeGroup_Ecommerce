-- KVM prices and 3-month warranty from the official price list (2026-10-21), for databases imported before
-- product/KVM/*/info/product.json carried them. Only fills what is still empty, so prices set in the admin win.

UPDATE products p
SET price = v.price,
    updated_at = now()
FROM (VALUES ('gl-inet-comet-gl-rm1', 3800000),
             ('gl-inet-comet-pro-gl-rm10', 4000000),
             ('jetkvm', 3200000),
             ('luckfox-picokvm', 2800000)) AS v (slug, price)
WHERE p.slug = v.slug
  AND p.price IS NULL;

UPDATE products
SET specs = specs || jsonb_build_array(jsonb_build_object(
        'key', 'warranty',
        'label', jsonb_build_object('en', 'Warranty', 'vi', 'Bảo hành', 'zh', '保修'),
        'value', jsonb_build_object('en', '3 months', 'vi', '3 tháng', 'zh', '3 个月'))),
    updated_at = now()
WHERE slug IN ('gl-inet-comet-gl-rm1', 'gl-inet-comet-pro-gl-rm10', 'jetkvm', 'luckfox-picokvm')
  AND NOT specs @> '[{"key": "warranty"}]';
