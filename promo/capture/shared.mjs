import { devices } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Tenant comes from the subdomain, so never use plain localhost.
export const WEB = process.env.PROMO_WEB ?? 'http://local1.localhost:8081';
export const API = process.env.PROMO_API ?? 'http://localhost:3000';
const EMAIL = 'owner@local1.test';
// Dev seed password (database/seeds/dev_local1.sql header).
const PASSWORD = process.env.PROMO_PASSWORD ?? 'Local1-dev-2026';

export const DESKTOP = { width: 1920, height: 1080 };
export const phone = (viewport, deviceScaleFactor = 3) => ({ ...devices['iPhone 13'], viewport, deviceScaleFactor, isMobile: true, hasTouch: true });

export const pause = (page, ms = 900) => page.waitForTimeout(ms);
export const type = (loc, text) => loc.pressSequentially(text, { delay: 60 });

export async function login(page, { submit = true } = {}) {
  await page.goto(`${WEB}/admin/login`);
  await type(page.getByLabel('Email'), EMAIL);
  await pause(page, 500);
  await type(page.getByLabel('Contraseña'), PASSWORD);
  await pause(page, 500);
  if (!submit) return;
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('tab', { name: 'Órdenes' }).waitFor();
  await pause(page, 1200);
}

export async function apiLogin() {
  const headers = { 'X-Tenant-Slug': 'local1', 'content-type': 'application/json' };
  const { access_token } = await (await fetch(`${API}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })).json();
  const authed = { ...headers, Authorization: `Bearer ${access_token}` };
  const me = await (await fetch(`${API}/me`, { headers: authed })).json();
  const screens = await (await fetch(`${API}/screens?store_id=${me.stores[0].store_id}`, { headers: authed })).json();
  return { jwt: access_token, screenToken: screens[0].token, storeId: me.stores[0].store_id };
}

// Wait for real content: network quiet, fonts and every <img>/<video> loaded.
export async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete) && [...document.querySelectorAll('video')].every((v) => v.readyState >= 3));
  await page.waitForTimeout(400);
}

// Places a real order through the public API so the orders list has a fresh "generada" one.
export async function placeOrder(customer_name) {
  const headers = { 'X-Tenant-Slug': 'local1', 'content-type': 'application/json' };
  const catalog = await (await fetch(`${API}/public/stores/palermo/catalog`, { headers })).json();
  const items = catalog.categories.flatMap((c) => c.products).slice(0, 2).map((p) => ({ product_id: p.product_id, quantity: 1 }));
  await fetch(`${API}/public/stores/palermo/orders`, { method: 'POST', headers, body: JSON.stringify({ items, customer_name }) });
}

// Re-uploads an image already in the screen content (real food photo) under a readable name.
export async function promoImage(jwt, storeId) {
  const headers = { 'X-Tenant-Slug': 'local1', Authorization: `Bearer ${jwt}` };
  const list = await (await fetch(`${API}/content?store_id=${storeId}`, { headers })).json();
  const item = list.find((c) => c.type === 'image');
  if (!item) throw new Error('No image content to reuse; upload one in the app first.');
  const res = await fetch(item.url.startsWith('http') ? item.url : `${API}${item.url}`, { headers });
  return { name: 'Promo hamburguesa.png', mimeType: res.headers.get('content-type') ?? 'image/png', buffer: Buffer.from(await res.arrayBuffer()) };
}

// CDP screencast at real device pixels (Playwright's recordVideo is capped at the CSS viewport size, so it looks soft).
// Chrome only emits frames when the page changes, so the MP4 is built from per-frame durations (concat demuxer).
// Start it once the screen is settled; stop() encodes to H.264 at `out` (default: viewport size x dsf).
export async function startScreencast(page, { dsf = 1, out } = {}) {
  const { width, height } = page.viewportSize();
  const [outW, outH] = out ?? [width * dsf, height * dsf];
  const dir = mkdtempSync(join(tmpdir(), 'promo-cast-'));
  const frames = []; // { file, ts } in seconds
  const writes = [];
  const cdp = await page.context().newCDPSession(page);
  let stopped = false; // frames still in flight after stop() must not write into the removed temp dir
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    if (stopped) return;
    const file = `f${String(frames.length).padStart(6, '0')}.jpg`;
    frames.push({ file, ts: metadata.timestamp });
    writes.push(writeFile(join(dir, file), Buffer.from(data, 'base64')));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: width * dsf, maxHeight: height * dsf, everyNthFrame: 1 });
  const started = Date.now();
  while (!frames.length) {
    if (Date.now() - started > 3000) throw new Error('Screencast produced no initial frame.');
    await page.waitForTimeout(50);
  }

  // Time spent in skip() (spinners, real network latency) is cut out: the last frame before it is held until the first one after it.
  const cuts = []; // [from, to] in seconds
  const adj = (ts) => ts - cuts.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(ts, b) - a), 0);

  return {
    async skip(fn) {
      const from = Date.now() / 1000;
      await fn();
      cuts.push([from, Date.now() / 1000]);
    },
    async stop(file) {
      const end = Date.now() / 1000;
      await cdp.send('Page.stopScreencast');
      stopped = true;
      await Promise.all(writes);
      // Frames inside a cut are dropped, except the last one of each cut: it is the settled state the page reached.
      const lastIn = cuts.map(([a, b]) => frames.findLast((f) => f.ts > a && f.ts < b)).filter(Boolean);
      const kept = frames.filter((f) => lastIn.includes(f) || !cuts.some(([a, b]) => f.ts > a && f.ts < b));
      const lines = kept.map((f, i) => {
        const next = i + 1 < kept.length ? kept[i + 1].ts : end;
        return `file '${f.file}'\nduration ${Math.max(adj(next) - adj(f.ts), 0.001).toFixed(4)}`;
      });
      lines.push(`file '${kept.at(-1).file}'`); // concat demuxer ignores the last duration unless the file is repeated
      writeFileSync(join(dir, 'list.txt'), lines.join('\n'));
      mkdirSync(join(file, '..'), { recursive: true });
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-i', join(dir, 'list.txt'),
        '-vf', `scale=${outW}:${outH}:flags=lanczos,format=yuv420p`, '-r', '30', '-fps_mode', 'cfr',
        '-c:v', 'libx264', '-crf', '14', '-an', file], { cwd: dir });
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Creates (through the API, not recorded) a playlist holding the promo image, so scenes that need an
// existing list start from it. Reuses the "Promo hamburguesa" media if an earlier scene already uploaded it.
export async function createPromoList({ jwt, storeId }, name) {
  const headers = { 'X-Tenant-Slug': 'local1', Authorization: `Bearer ${jwt}` };
  const json = { ...headers, 'content-type': 'application/json' };
  const library = await (await fetch(`${API}/content`, { headers })).json();
  let media = library.find((m) => m.original_name.startsWith('Promo hamburguesa'));
  if (!media) {
    const { name: fileName, mimeType, buffer } = await promoImage(jwt, storeId);
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), fileName);
    media = await (await fetch(`${API}/content`, { method: 'POST', headers, body: form })).json();
  }
  const list = await (await fetch(`${API}/playlists`, { method: 'POST', headers: json, body: JSON.stringify({ name }) })).json();
  await fetch(`${API}/playlists/${list.playlist_id}/items`, { method: 'PUT', headers: json, body: JSON.stringify({ items: [{ media_id: media.media_id, duration_seconds: 8 }] }) });
  return list;
}
