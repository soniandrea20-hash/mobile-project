-- DEV ONLY. Resets the demo data that promo/capture accumulates on every recording run, so each run
-- starts clean: all orders of tenant 'local1' / store 'palermo' and the uploaded "Promo hamburguesa" content.
-- Idempotent: running it again deletes nothing and leaves the same state.
-- Everything is scoped by tenant/store slug, never by raw IDs. Seed content and other stores are untouched.

BEGIN;

-- order_items go away with their order (ON DELETE CASCADE).
DELETE FROM orders o
USING stores s, tenants t
WHERE o.store_id = s.store_id AND s.tenant_id = t.tenant_id
  AND t.slug = 'local1' AND s.slug = 'palermo';

-- The public order number comes from tenants.last_order_number (per tenant, not per store).
-- Rewinding it to the highest number still in use makes the next order #1 when the tenant has no other
-- orders, and never collides with uq_orders_tenant_number if another store still has some.
UPDATE tenants t
SET last_order_number = COALESCE((SELECT MAX(o.order_number) FROM orders o WHERE o.tenant_id = t.tenant_id), 0)
WHERE t.slug = 'local1';

-- Rows only: the uploaded files stay orphaned in the dev uploads dir / blob container (acceptable in dev).
-- Promo items are appended at the end of the playlist, so the remaining sort_order stays consecutive.
DELETE FROM content_items c
USING stores s, tenants t
WHERE c.store_id = s.store_id AND s.tenant_id = t.tenant_id
  AND t.slug = 'local1' AND s.slug = 'palermo'
  AND c.original_name LIKE 'Promo hamburguesa%';

COMMIT;
