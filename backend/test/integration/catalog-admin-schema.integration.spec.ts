import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runMigrations(): void {
  execFileSync('npm', ['run', 'migrate'], {
    cwd: resolve(__dirname, '../..'),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: 'local',
      PORT: '3000',
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: 'catalog-admin-schema-access-token-secret',
      AUTH_OTP_PEPPER: 'catalog-admin-schema-otp-pepper',
      AUTH_DEVELOPMENT_OTP: '123456',
      CORS_ORIGINS: 'http://localhost:5173',
    },
    stdio: 'inherit',
  });
}

describe('схема управления каталогом', () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    pool = new Pool({ connectionString: databaseUrl });
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    'сохраняет аудит, его связи и индексы',
    async () => {
      const actorId = randomUUID();
      const entityId = randomUUID();
      const requestId = `catalog-admin-${randomUUID()}`;

      await pool.query(`INSERT INTO users (id, phone_e164, role) VALUES ($1, $2, 'administrator')`, [
        actorId,
        '+7999' + Math.floor(Math.random() * 10_000_000).toString().padStart(7, '0'),
      ]);
      const auditEvent = await pool.query<{
        action: string;
        after_state: object;
        before_state: object;
        created_at: Date;
        entity_id: string;
        entity_type: string;
        request_id: string;
      }>(
        `INSERT INTO audit_events (
          actor_id, entity_type, entity_id, action, before_state, after_state, request_id
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING action, after_state, before_state, created_at, entity_id, entity_type, request_id`,
        [
          actorId,
          'product',
          entityId,
          'updated',
          { name: 'Капучино', price: 199 },
          { name: 'Капучино', price: 209 },
          requestId,
        ],
      );
      const indexes = await pool.query<{ indexname: string }>(
        `SELECT indexname
         FROM pg_indexes
         WHERE schemaname = 'public'
           AND tablename = 'audit_events'
         ORDER BY indexname`,
      );

      expect(auditEvent.rows).toEqual([
        expect.objectContaining({
          action: 'updated',
          after_state: { name: 'Капучино', price: 209 },
          before_state: { name: 'Капучино', price: 199 },
          created_at: expect.any(Date),
          entity_id: entityId,
          entity_type: 'product',
          request_id: requestId,
        }),
      ]);
      expect(indexes.rows).toEqual(
        expect.arrayContaining([
          { indexname: 'audit_events_actor_created_at_index' },
          { indexname: 'audit_events_entity_created_at_index' },
        ]),
      );
      await expect(
        pool.query(
          `INSERT INTO audit_events (
            actor_id, entity_type, entity_id, action, before_state, after_state, request_id
          )
           VALUES ($1, 'product', $2, 'updated', '{}', '{}', 'missing-actor')`,
          [randomUUID(), entityId],
        ),
      ).rejects.toMatchObject({ code: '23503' });
    },
    externalProcessTimeoutMs,
  );

  it(
    'освобождает размер архивированного варианта для нового варианта',
    async () => {
      const categoryId = randomUUID();
      const productId = randomUUID();
      const sortOrder = Math.floor(Math.random() * 1_000_000_000);

      await pool.query(
        `INSERT INTO categories (id, name, sort_order) VALUES ($1, $2, $3)`,
        [categoryId, `Категория ${categoryId}`, sortOrder],
      );
      await pool.query(
        `INSERT INTO products (id, category_id, type, name, sort_order)
         VALUES ($1, $2, 'DRINK', $3, $4)`,
        [productId, categoryId, `Напиток ${productId}`, sortOrder],
      );
      await pool.query(
        `INSERT INTO product_variants (product_id, size, price, sort_order)
         VALUES ($1, 'M', 100, $2)`,
        [productId, sortOrder],
      );
      await pool.query(
        `UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE product_id = $1`,
        [productId],
      );
      await pool.query(
        `INSERT INTO product_variants (product_id, size, price, sort_order)
         VALUES ($1, 'M', 110, $2)`,
        [productId, sortOrder],
      );
      await expect(
        pool.query(
          `INSERT INTO product_variants (product_id, size, price, sort_order)
           VALUES ($1, 'M', 120, $2)`,
          [productId, sortOrder + 1],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    },
    externalProcessTimeoutMs,
  );
});
