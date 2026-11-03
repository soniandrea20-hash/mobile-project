import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP, WEB, apiLogin, pause, phone, placeOrder, promoImage, settle, startScreencast, type } from './shared.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scenes');
const filter = process.argv[2];

// Phone: 405x720 @3x = 1215x2160 source, downscaled to 1080x1920 (supersampled); desktop: 1920x1080 @1x.
const PHONE = phone({ width: 405, height: 720 });
const WIDE = { viewport: DESKTOP };

const addToCart = async (page, names) => {
  for (const n of names) {
    await page.getByRole('button', { name: new RegExp(`^Agregar ${n}`) }).first().click();
    await pause(page, 900);
  }
};

// setup() gets the page to its settled starting screen (not recorded); run() is the recorded scene.
const scenes = {
  's3-autopedido': {
    context: PHONE,
    async setup(page) {
      await page.goto(`${WEB}/palermo`);
      await page.getByRole('button', { name: /^Agregar / }).first().waitFor();
      await settle(page);
    },
    async run(page) {
      await pause(page, 2000);
      await page.getByRole('button', { name: 'Bebidas' }).click();
      await pause(page, 2000);
      await page.getByRole('button', { name: 'Hamburguesas' }).click();
      await pause(page, 1500);
      await addToCart(page, ['Clasica', 'Doble queso']);
      await page.getByRole('button', { name: /Ver carrito · / }).click();
      await page.getByText('Tu pedido', { exact: true }).waitFor();
      await pause(page, 2000);
    },
  },
  's4-confirmar': {
    context: PHONE,
    async setup(page) {
      await page.goto(`${WEB}/palermo`);
      await page.getByRole('button', { name: /^Agregar / }).first().waitFor();
      await addToCart(page, ['Clasica', 'Doble queso']);
      await page.getByRole('button', { name: /Ver carrito · / }).click();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.getByLabel('Tu nombre').waitFor();
      await settle(page);
    },
    async run(page) {
      await type(page.getByLabel('Tu nombre'), 'Sofia');
      await pause(page, 800);
      await page.getByRole('button', { name: 'Confirmar pedido' }).click(); // real order
      await page.getByText('Pedido registrado').waitFor();
      await settle(page);
      await pause(page, 800);
    },
  },
  's5-ordenes': {
    auth: true,
    context: WIDE,
    async setup(page) {
      await placeOrder('Sofia'); // fresh "generada" order to move through the states
      await page.goto(`${WEB}/admin/ordenes`);
      await page.getByRole('button', { name: /Pedido #/ }).first().waitFor();
      await settle(page);
    },
    async run(page) {
      await pause(page, 600);
      await page.getByRole('button', { name: /Pedido #/ }).first().click();
      await page.getByText('Cargando ítems').waitFor({ state: 'hidden' });
      await pause(page, 1000);
      await page.getByRole('button', { name: 'Empezar preparación' }).click();
      await pause(page, 1200);
      await page.getByRole('button', { name: 'Marcar lista' }).click();
      await page.getByRole('button', { name: 'Marcar entregada' }).waitFor(); // "lista" state reached
      await pause(page, 1000);
    },
  },
  's6-catalogo': {
    auth: true,
    context: WIDE,
    async setup(page) {
      await page.goto(`${WEB}/admin/catalogo`);
      await page.getByText('Clasica').first().waitFor();
      await settle(page);
    },
    async run(page) {
      await pause(page, 500);
      await page.getByText('Clasica').first().click();
      await page.getByLabel('Nombre').waitFor();
      await pause(page, 1800);
      await page.goBack();
      await page.getByRole('button', { name: '+ Nuevo producto' }).click();
      await page.getByLabel('Nombre').pressSequentially('Hamburguesa de la casa', { delay: 35 });
      await pause(page, 300);
      await page.getByLabel('Descripción').pressSequentially('Medallon, cheddar y salsa especial', { delay: 35 });
      await pause(page, 300);
      await page.getByLabel('Precio').pressSequentially('8900', { delay: 35 });
      await pause(page, 800);
    },
  },
  's7a-contenido': {
    auth: true,
    context: WIDE,
    async setup(page) {
      await page.goto(`${WEB}/admin/pantallas/contenido`);
      await page.getByText('Se reproduce en este orden').waitFor();
      await settle(page);
    },
    async run(page, { image }) {
      await pause(page, 1000);
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Subir imagen o video' }).click();
      await (await chooser).setFiles(image);
      await page.getByText('Promo hamburguesa').first().waitFor();
      await settle(page);
      await pause(page, 1800);
    },
  },
  's7b-player': {
    context: WIDE,
    async setup(page, { screenToken }) {
      await page.goto(`${WEB}/screen/${screenToken}`);
      await settle(page);
      await pause(page, 1500); // first item on screen before the scene starts
    },
    run: (page) => pause(page, 8000),
  },
};

const names = Object.keys(scenes).filter((n) => !filter || n.includes(filter));
if (!names.length) throw new Error(`No scene matches "${filter}". Options: ${Object.keys(scenes).join(', ')}`);

mkdirSync(OUT, { recursive: true });
const ctx = await apiLogin();
const browser = await chromium.launch();
const image = await promoImage(ctx.jwt, ctx.storeId);

for (const name of names) {
  const scene = scenes[name];
  const context = await browser.newContext(scene.context);
  if (scene.auth) await context.addInitScript((t) => window.localStorage.setItem('mostrador.token', t), ctx.jwt);
  const page = await context.newPage();
  try {
    await scene.setup(page, ctx);
    const rec = await startScreencast(page, scene.context === PHONE ? { dsf: 3, out: [1080, 1920] } : {});
    await scene.run(page, { ...ctx, image });
    await pause(page, 500);
    await rec.stop(join(OUT, `${name}.mp4`));
  } finally {
    await context.close();
  }
  console.log(`ok ${name}`);
}

await browser.close();
