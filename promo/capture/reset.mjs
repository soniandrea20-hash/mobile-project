import pg from 'pg';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Same DB_* variables the backend uses (TypeORM config in backend/src/app.module.ts); never logged.
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
const client = new pg.Client({ host: DB_HOST, port: Number(DB_PORT), user: DB_USERNAME, password: DB_PASSWORD, database: DB_NAME });
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'sql', 'reset_demo_orders.sql'), 'utf8');

await client.connect();
try {
  const results = await client.query(sql); // multi-statement: one result per statement
  const label = { DELETE: 'deleted', UPDATE: 'updated' };
  for (const r of results.filter((r) => label[r.command])) console.log(`${r.command} ${label[r.command]} ${r.rowCount} rows`);
} finally {
  await client.end();
}
