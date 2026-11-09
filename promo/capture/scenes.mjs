import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP, WEB, apiLogin, createPromoList, pause, phone, placeOrder, promoImage, settle, startScreencast, type } from './shared.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scenes');
const filter = process.argv[2];

// Phone: 405x720 @3x = 1215x2160 source, downscaled to 1080x1920 (supersampled); desktop: 1920x1080 @1x.
const PHONE = phone({ width: 405, height: 720 });
const WIDE = { viewport: DESKTOP };
// Pantallas screens are narrow forms: a 960x540 @2x viewport (still the wide layout, >= 900) fills the laptop frame at 1920x1080.
const COMPACT = { viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 };
const COMPACT_CAST = { dsf: 2, out: [1920, 1080] };

const addToCart = async (page, names) => {
  for (const n of names) {
    await page.getByRole('button', { name: new RegExp(`^Agregar ${n}`) }).first().click();
    await pause(page, 900);
  }
};

// Opens the product detail, bumps the quantity by one and adds it from the sheet.
const addWithDetail = async (page, name, { slow = false } = {}) => {
  await page.getByRole('button', { name: `Ver ${name}` }).first().click();
  await page.getByRole('button', { name: /^Agregar · / }).waitFor();
  await settle(page);
  if (slow) await pause(page, 1100);
  await page.getByRole('button', { name: 'Agregar uno' }).click();
  if (slow) await pause(page, 1000);
  await page.getByRole('button', { name: /^Agregar · / }).click();
  await page.getByRole('button', { name: /^Agregar · / }).waitFor({ state: 'hidden' });
  await pause(page, slow ? 1000 : 300);
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
      await pause(page, 1200);
      await page.getByRole('button', { name: 'Bebidas' }).click();
      await pause(page, 1200);
      await page.getByRole('button', { name: 'Hamburguesas' }).click();
      await pause(page, 1000);
      await addWithDetail(page, 'Clasica', { slow: true }); // detail sheet, quantity 2
      await addToCart(page, ['Doble queso']);
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
      await addWithDetail(page, 'Clasica');
      await addToCart(page, ['Doble queso']);
      await page.getByRole('button', { name: /Ver carrito · / }).click();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.getByLabel('Tu nombre').waitFor();
      await settle(page);
    },
    async run(page, { rec }) {
      await type(page.getByLabel('Tu nombre'), 'Sofia');
      await pause(page, 800);
      await rec.skip(async () => {
        await page.getByRole('button', { name: 'Confirmar pedido' }).click(); // real order
        await page.getByText('Pedido registrado').waitFor();
        await settle(page);
      });
      await pause(page, 2000);
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
    async run(page, { rec }) {
      await pause(page, 500);
      await rec.skip(async () => {
        await page.getByText('Clasica').first().click();
        await page.getByLabel('Nombre').waitFor();
        await page.waitForFunction(() => [...document.querySelectorAll('input')].some((i) => i.value === 'Clasica'));
        await settle(page);
      });
      await pause(page, 1800);
      await rec.skip(async () => {
        await page.goBack();
        await page.getByRole('button', { name: '+ Nuevo producto' }).click();
        await page.getByLabel('Nombre').waitFor();
        await settle(page);
      });
      await page.getByLabel('Nombre').pressSequentially('Hamburguesa de la casa', { delay: 35 });
      await pause(page, 300);
      await page.getByLabel('Descripción').pressSequentially('Medallon, cheddar y salsa especial', { delay: 35 });
      await pause(page, 300);
      await page.getByLabel('Precio').pressSequentially('8900', { delay: 35 });
      await pause(page, 800);
    },
  },
  's7a-lista': {
    auth: true,
    context: COMPACT,
    cast: COMPACT_CAST,
    async setup(page) {
      await page.goto(`${WEB}/admin/pantallas?tab=listas`);
      await page.getByRole('button', { name: '+ Nueva lista' }).waitFor();
      await settle(page);
    },
    async run(page, { image, rec }) {
      await pause(page, 700);
      await page.getByRole('button', { name: '+ Nueva lista' }).click();
      await type(page.getByLabel('Nombre de la lista'), 'Promo del día');
      await pause(page, 400);
      await rec.skip(async () => {
        await page.getByRole('button', { name: 'Crear lista' }).click();
        await page.getByText('Qué se muestra').waitFor();
        await settle(page);
      });
      await pause(page, 600);
      await page.getByRole('button', { name: '+ Agregar' }).click();
      await pause(page, 500);
      await rec.skip(async () => {
        const chooser = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Subir nuevo' }).click();
        await (await chooser).setFiles(image);
        await page.getByText('Promo hamburguesa.png').first().waitFor();
        await settle(page);
      });
      await pause(page, 700);
      await page.getByRole('button', { name: 'Agregar uno' }).click();
      await page.getByText('Guardado').waitFor();
      await pause(page, 900);
    },
  },
  's7c-horario': {
    auth: true,
    context: COMPACT,
    cast: COMPACT_CAST,
    async setup(page, ctx) {
      await createPromoList(ctx, 'Desayunos');
      await page.goto(`${WEB}/admin/pantallas`);
      await page.getByRole('button', { name: /^Sala central/ }).waitFor();
      await page.getByText('Ahora: ...').waitFor({ state: 'hidden' });
      await settle(page);
    },
    async run(page, { rec }) {
      await pause(page, 700);
      await rec.skip(async () => {
        await page.getByRole('button', { name: /^Sala central/ }).click();
        await page.getByText('Horarios especiales').waitFor();
        await settle(page);
      });
      await pause(page, 600);
      await page.getByRole('button', { name: '+ Agregar horario' }).click();
      await page.getByText('Nuevo horario especial').waitFor();
      await pause(page, 700);
      await page.getByRole('dialog').getByRole('button', { name: 'Desayunos' }).click();
      await pause(page, 800);
      await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
      await page.getByText('Guardado').waitFor();
      await pause(page, 1000);
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
    const rec = await startScreencast(page, scene.cast ?? (scene.context === PHONE ? { dsf: 3, out: [1080, 1920] } : {}));
    await scene.run(page, { ...ctx, image, rec });
    await pause(page, 500);
    await rec.stop(join(OUT, `${name}.mp4`));
  } finally {
    await context.close();
  }
  console.log(`ok ${name}`);
}

await browser.close();
