-- DEV ONLY. Resets the demo data that promo/capture accumulates on every recording run, so each run
-- starts clean: all orders of tenant 'local1' / store 'palermo' and the playlists/media the scenes create.
-- Idempotent: running it again deletes nothing and leaves the same state.
-- Everything is scoped by tenant/store slug, never by raw IDs. Seed data, other stores and the
-- playlists/media a person created by hand (anything not named below) are untouched.

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

-- Lists created by the scenes (scenes.mjs / stills.mjs). Deleting a playlist cascades to its
-- playlist_items and to its screen_playlists rows, which removes the "horario especial" the scene added
-- without touching the screen's own default list.
DELETE FROM playlists p
USING tenants t
WHERE p.tenant_id = t.tenant_id
  AND t.slug = 'local1'
  AND p.name IN ('Promo del día', 'Desayunos');

-- Media rows only: the uploaded files stay orphaned in the dev uploads dir / blob container (acceptable in dev).
-- Must run after the playlists delete (playlist_items.media_id is ON DELETE RESTRICT); the NOT EXISTS keeps
-- a copy that someone put into one of their own lists instead of failing the whole reset.
DELETE FROM media_items m
USING tenants t
WHERE m.tenant_id = t.tenant_id
  AND t.slug = 'local1'
  AND m.original_name LIKE 'Promo hamburguesa%'
  AND NOT EXISTS (SELECT 1 FROM playlist_items i WHERE i.media_id = m.media_id);

COMMIT;
