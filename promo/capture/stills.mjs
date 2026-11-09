import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP, WEB, apiLogin, createPromoList, login, pause, phone, settle } from './shared.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'stills');
const filter = process.argv[2];

// Phone is exactly 9:16 (405x720 @3x = 1215x2160); desktop/player 16:9 (1920x1080 @2x = 3840x2160).
const groups = {
  phone: {
    context: phone({ width: 405, height: 720 }),
    async run(page, shot) {
      await page.goto(`${WEB}/palermo`);
      await page.getByRole('button', { name: /^Agregar / }).first().waitFor();
      await shot('01-catalogo');
      await page.getByRole('button', { name: 'Bebidas' }).click();
      await shot('02-catalogo-categoria');
      await page.getByRole('button', { name: 'Hamburguesas' }).click();
      await page.getByRole('button', { name: 'Ver Clasica' }).first().click();
      await page.getByRole('button', { name: /^Agregar · / }).waitFor();
      await shot('02b-detalle-producto');
      await page.getByRole('button', { name: 'Agregar uno' }).click();
      await page.getByRole('button', { name: /^Agregar · / }).click();
      await page.getByRole('button', { name: /^Agregar · / }).waitFor({ state: 'hidden' });
      for (const n of ['Doble queso', 'Veggie']) await page.getByRole('button', { name: new RegExp(`^Agregar ${n}`) }).first().click();
      await page.getByRole('button', { name: /Ver carrito · / }).click();
      await page.getByText('Tu pedido', { exact: true }).waitFor();
      await shot('03-carrito');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await page.getByLabel('Tu nombre').fill('Sofia');
      await page.getByLabel('Nota para el local (opcional)').fill('Sin cebolla, por favor');
      await shot('04-confirmar');
      await page.getByRole('button', { name: 'Confirmar pedido' }).click(); // the single real order of the run
      await page.getByText('Pedido registrado').waitFor();
      await shot('05-pedido-registrado');
    },
  },
  desktop: {
    context: { viewport: DESKTOP, deviceScaleFactor: 2 },
    async run(page, shot, ctx) {
      await login(page, { submit: false });
      await shot('10-login');
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await page.getByRole('tab', { name: 'Órdenes' }).waitFor();
      await page.getByRole('tab', { name: 'Órdenes' }).click();
      await page.getByRole('button', { name: /Pedido #/ }).first().click(); // newest order, expanded
      await page.getByRole('button', { name: 'Empezar preparación' }).waitFor();
      await page.getByText('Cargando ítems').waitFor({ state: 'hidden' });
      await shot('11-ordenes');
      await page.goto(`${WEB}/admin/catalogo`);
      await page.getByText('Clasica').first().waitFor();
      await shot('12-catalogo');
      await page.getByText('Clasica').first().click();
      await page.getByLabel('Nombre').waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('input')].some((i) => i.value === 'Clasica'));
      await shot('13-producto-editar');
      await page.goBack();
      await page.getByRole('button', { name: '+ Nuevo producto' }).click();
      await page.getByLabel('Nombre').fill('Hamburguesa de la casa');
      await page.getByLabel('Descripción').fill('Medallon, cheddar y salsa especial');
      await page.getByLabel('Precio').fill('8900');
      await shot('14-producto-nuevo');
      await page.goto(`${WEB}/admin/pantallas`);
      await page.getByRole('button', { name: /^Sala central/ }).waitFor();
      await page.getByText('Ahora: ...').waitFor({ state: 'hidden' });
      await shot('15-pantallas');
      await page.getByRole('button', { name: 'Listas', exact: true }).click();
      await page.getByRole('button', { name: '+ Nueva lista' }).waitFor();
      await shot('16-listas');
      const promo = await createPromoList(ctx, 'Promo del día');
      await page.goto(`${WEB}/admin/pantallas/lista/${promo.playlist_id}`);
      await page.getByText('Promo hamburguesa.png').first().waitFor();
      await shot('16b-lista');
      await createPromoList(ctx, 'Desayunos');
      await page.goto(`${WEB}/admin/pantallas`);
      await page.getByRole('button', { name: /^Sala central/ }).click();
      await page.getByRole('button', { name: '+ Agregar horario' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Desayunos' }).click();
      await shot('16c-horario', { quick: true });
      await page.goto(`${WEB}/admin/ajustes`);
      await page.waitForFunction(() => [...document.querySelectorAll('input')].some((i) => i.value));
      await shot('17-ajustes');
    },
  },
  player: {
    context: { viewport: DESKTOP, deviceScaleFactor: 2 },
    async run(page, shot, token) {
      await page.goto(`${WEB}/screen/${token}`);
      await pause(page, 3000); // let the first content item appear
      await shot('20-pantalla-player');
    },
  },
};

mkdirSync(OUT, { recursive: true });
const { jwt, screenToken, storeId } = await apiLogin();
const browser = await chromium.launch();
let taken = 0;

for (const [name, group] of Object.entries(groups)) {
  const context = await browser.newContext(group.context);
  if (name !== 'desktop') await context.addInitScript((t) => window.localStorage.setItem('mostrador.token', t), jwt);
  const page = await context.newPage();
  const shot = async (file, { quick = false } = {}) => {
    if (filter && !file.includes(filter)) return;
    if (quick) await pause(page, 1000); // the open sheet never reports every <img> complete
    else await settle(page);
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.screenshot({ path: join(OUT, `${file}.png`) }); // caret hidden by default
    taken++;
    console.log(`ok ${file}`);
  };
  try {
    await group.run(page, shot, name === 'desktop' ? { jwt, storeId } : screenToken);
  } finally {
    await context.close();
  }
}

await browser.close();
if (!taken) throw new Error(`No still matches "${filter}".`);
