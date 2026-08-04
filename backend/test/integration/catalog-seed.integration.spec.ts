import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { catalogSeed } from '../../scripts/seed.constants';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;
const bootstrapAdministratorPhone = '+79991234567';

function runScript(script: 'migrate' | 'seed'): void {
  execFileSync('npm', ['run', script], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      BOOTSTRAP_ADMIN_PHONE: bootstrapAdministratorPhone,
      AUTH_ACCESS_TOKEN_SECRET: 'catalog-seed-access-token-secret',
      AUTH_OTP_PEPPER: 'catalog-seed-otp-pepper',
      AUTH_DEVELOPMENT_OTP: '123456',
      CORS_ORIGINS: 'http://localhost:5173',
    },
    stdio: 'inherit',
  });
}

async function readCatalogState(pool: Pool): Promise<object> {
  const result = await pool.query<{ state: object }>(
    `SELECT jsonb_build_object(
      'categories', (SELECT jsonb_agg(row_to_json(categories) ORDER BY id) FROM categories),
      'products', (SELECT jsonb_agg(row_to_json(products) ORDER BY id) FROM products),
      'productVariants', (SELECT jsonb_agg(row_to_json(product_variants) ORDER BY id) FROM product_variants),
      'modifierGroups', (SELECT jsonb_agg(row_to_json(modifier_groups) ORDER BY id) FROM modifier_groups),
      'modifierOptions', (SELECT jsonb_agg(row_to_json(modifier_options) ORDER BY id) FROM modifier_options),
      'categoryModifierGroups', (
        SELECT jsonb_agg(row_to_json(category_modifier_groups) ORDER BY category_id, group_id)
        FROM category_modifier_groups
      )
    ) AS state`,
  );
  const state = result.rows[0]?.state;

  if (state === undefined) {
    throw new Error('Catalog state was not read');
  }

  return state;
}

describe('seed каталога', () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    pool = new Pool({ connectionString: databaseUrl });
    runScript('migrate');
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    'восстанавливает канонический каталог повторным seed и сохраняет пользователей',
    async () => {
      const preservedPhone = '+7999' + Math.floor(Math.random() * 10_000_000).toString().padStart(7, '0');
      const cappuccino = catalogSeed.products.find((product) => product.name === 'Капучино');

      if (cappuccino === undefined) {
        throw new Error('Cappuccino fixture is required');
      }

      await pool.query(`INSERT INTO users (id, phone_e164, role) VALUES ($1, $2, 'barista')`, [
        randomUUID(),
        preservedPhone,
      ]);
      runScript('seed');
      const firstState = await readCatalogState(pool);

      await pool.query(
        `UPDATE products SET name = 'Изменённый товар', is_available = false WHERE id = $1`,
        [cappuccino.id],
      );
      runScript('seed');
      const secondState = await readCatalogState(pool);
      const preservedUser = await pool.query<{ phone_e164: string; role: string }>(
        'SELECT phone_e164, role FROM users WHERE phone_e164 = $1',
        [preservedPhone],
      );

      expect(secondState).toEqual(firstState);
      expect(preservedUser.rows).toEqual([{ phone_e164: preservedPhone, role: 'barista' }]);
      expect(firstState).toMatchObject({
        categories: expect.arrayContaining([
          expect.objectContaining({ name: 'Кофе', is_active: true }),
        ]),
        products: expect.arrayContaining([
          expect.objectContaining({ name: 'Капучино', type: 'DRINK', is_available: true }),
          expect.objectContaining({ name: 'Эспрессо', type: 'DRINK', is_available: true }),
          expect.objectContaining({ name: 'Круассан', type: 'OTHER', is_available: true }),
          expect.objectContaining({ name: 'Чизкейк', type: 'OTHER', is_available: false }),
          expect.objectContaining({ name: 'Тестовый напиток', type: 'DRINK', is_active: false }),
        ]),
        productVariants: expect.arrayContaining([
          expect.objectContaining({ size: 'S' }),
          expect.objectContaining({ size: 'M' }),
          expect.objectContaining({ size: 'L' }),
        ]),
        modifierGroups: expect.arrayContaining([
          expect.objectContaining({ name: 'Молоко', min_select: 1, max_select: 1 }),
        ]),
        modifierOptions: expect.arrayContaining([
          expect.objectContaining({ name: 'Обычное молоко', price_delta_minor: 0, is_default: true }),
        ]),
      });
    },
    externalProcessTimeoutMs,
  );
});
