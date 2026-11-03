import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESKTOP, WEB, apiLogin, login, pause, phone, settle } from './shared.mjs';

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
      for (const n of ['Clasica', 'Doble queso', 'Veggie']) await page.getByRole('button', { name: new RegExp(`^Agregar ${n}`) }).first().click();
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
    async run(page, shot) {
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
      await page.getByText('Abrí este enlace en el navegador del televisor').waitFor();
      await shot('15-pantallas');
      await page.getByRole('button', { name: 'Contenido de pantalla' }).click();
      await page.getByText('Se reproduce en este orden').waitFor();
      await shot('16-contenido');
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
const { jwt, screenToken } = await apiLogin();
const browser = await chromium.launch();
let taken = 0;

for (const [name, group] of Object.entries(groups)) {
  const context = await browser.newContext(group.context);
  if (name !== 'desktop') await context.addInitScript((t) => window.localStorage.setItem('mostrador.token', t), jwt);
  const page = await context.newPage();
  const shot = async (file) => {
    if (filter && !file.includes(filter)) return;
    await settle(page);
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.screenshot({ path: join(OUT, `${file}.png`) }); // caret hidden by default
    taken++;
    console.log(`ok ${file}`);
  };
  try {
    await group.run(page, shot, screenToken);
  } finally {
    await context.close();
  }
}

await browser.close();
if (!taken) throw new Error(`No still matches "${filter}".`);
