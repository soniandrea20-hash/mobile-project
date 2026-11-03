import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP, WEB, apiLogin, login, pause, phone, placeOrder, settle, startScreencast, type } from './shared.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIPS = join(ROOT, 'clips');
const TMP = join(CLIPS, '.tmp');

const PHONE = phone({ width: 405, height: 720 });

// auth: true seeds the session token so the clip starts already logged in.
const flows = {
  'autopedido-mobile': {
    context: PHONE,
    screencast: { dsf: 3, out: [1080, 1920] }, // real-pixel MP4 instead of Playwright's soft recordVideo
    async setup(page) {
      await page.goto(`${WEB}/palermo`);
      await page.getByRole('button', { name: /^Agregar / }).first().waitFor();
      await settle(page);
    },
    async run(page) {
      await pause(page, 1500);
      await page.getByRole('button', { name: 'Bebidas' }).click();
      await pause(page, 1200);
      await page.getByRole('button', { name: 'Hamburguesas' }).click();
      await pause(page, 1000);
      for (const n of ['Clasica', 'Doble queso', 'Veggie']) {
        await page.getByRole('button', { name: new RegExp(`^Agregar ${n}`) }).first().click();
        await pause(page, 900);
      }
      await page.getByRole('button', { name: /Ver carrito · / }).click();
      await page.getByText('Tu pedido', { exact: true }).waitFor();
      await pause(page, 1500);
      await page.getByRole('button', { name: 'Continuar' }).click();
      await type(page.getByLabel('Tu nombre'), 'Sofia');
      await pause(page);
      await type(page.getByLabel('Nota para el local (opcional)'), 'Sin cebolla, por favor');
      await pause(page);
      await page.getByRole('button', { name: 'Confirmar pedido' }).click();
      await page.getByText('Pedido registrado').waitFor();
      await pause(page, 2500);
    },
  },
  'backoffice-ordenes': {
    context: { viewport: DESKTOP, recordVideo: { dir: TMP, size: DESKTOP } },
    async run(page) {
      await placeOrder('Sofia'); // newest order must be "generada" to walk it through the states
      await login(page);
      await page.getByRole('tab', { name: 'Órdenes' }).click();
      await pause(page, 1500);
      await page.getByRole('button', { name: /Pedido #/ }).first().click(); // newest order first
      await pause(page, 1500);
      await page.getByRole('button', { name: 'Empezar preparación' }).click();
      await pause(page, 1500);
      await page.getByRole('button', { name: /^Marcar lista|^Lista/ }).first().click();
      await page.getByRole('button', { name: 'Marcar entregada' }).waitFor(); // the "lista" state
      await pause(page, 1500);
    },
  },
  'backoffice-catalogo': {
    auth: true,
    context: { viewport: DESKTOP, recordVideo: { dir: TMP, size: DESKTOP } },
    async run(page) {
      await page.goto(`${WEB}/admin/catalogo`);
      await page.getByText('Clasica').first().waitFor();
      await pause(page, 1500);
      await page.getByRole('button', { name: 'Bebidas' }).click();
      await pause(page, 1000);
      await page.getByRole('button', { name: 'Todas' }).click();
      await pause(page, 800);
      await page.getByText('Clasica').first().click(); // edit form, not saved
      await page.getByLabel('Nombre').waitFor();
      await pause(page, 2500);
      await page.goBack();
      await page.getByRole('button', { name: '+ Nuevo producto' }).click();
      await type(page.getByLabel('Nombre'), 'Hamburguesa de la casa');
      await pause(page);
      await type(page.getByLabel('Descripción'), 'Medallon, cheddar y salsa especial');
      await pause(page);
      await type(page.getByLabel('Precio'), '8900');
      await pause(page, 2000);
    },
  },
  'backoffice-pantallas': {
    auth: true,
    context: { viewport: DESKTOP, recordVideo: { dir: TMP, size: DESKTOP } },
    async run(page) {
      await page.goto(`${WEB}/admin/pantallas`);
      await page.getByText('Abrí este enlace en el navegador del televisor').waitFor();
      await pause(page, 2500);
      await page.getByRole('button', { name: 'Contenido de pantalla' }).click();
      await page.getByText('Se reproduce en este orden').waitFor();
      await pause(page, 3000);
    },
  },
  'pantalla-player': {
    context: { viewport: DESKTOP, recordVideo: { dir: TMP, size: DESKTOP } },
    async run(page, token) {
      await page.goto(`${WEB}/screen/${token}`);
      await page.waitForTimeout(10000);
    },
  },
};

const filter = process.argv[2];
const names = Object.keys(flows).filter((n) => !filter || n.includes(filter));
if (!names.length) throw new Error(`No clip matches "${filter}". Options: ${Object.keys(flows).join(', ')}`);

mkdirSync(CLIPS, { recursive: true });
const { jwt, screenToken } = await apiLogin();
const browser = await chromium.launch();

for (const name of names) {
  const flow = flows[name];
  const context = await browser.newContext(flow.context);
  if (flow.auth) await context.addInitScript((t) => window.localStorage.setItem('mostrador.token', t), jwt);
  const page = await context.newPage();
  try {
    await flow.setup?.(page);
    const rec = flow.screencast && (await startScreencast(page, flow.screencast));
    await flow.run(page, screenToken);
    await page.screenshot({ path: join(CLIPS, `${name}.png`) });
    await rec?.stop(join(CLIPS, `${name}.mp4`));
  } finally {
    const video = page.video();
    await context.close();
    await video?.saveAs(join(CLIPS, `${name}.webm`));
  }
  console.log(`ok ${name}`);
}

await browser.close();
rmSync(TMP, { recursive: true, force: true });
