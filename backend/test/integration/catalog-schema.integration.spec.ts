import { randomInt, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runMigrations(): void {
  execFileSync("npm", ["run", "migrate"], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "catalog-schema-access-token-secret",
      AUTH_OTP_PEPPER: "catalog-schema-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
    },
    stdio: "inherit",
  });
}

function createCategoryId(): string {
  return randomUUID();
}

describe("схема каталога", () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for integration tests");
    }

    pool = new Pool({ connectionString: databaseUrl });
    runMigrations();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "сохраняет модель каталога и отклоняет недопустимые строковые инварианты",
    async () => {
      const categoryId = createCategoryId();
      const productId = randomUUID();
      const groupId = randomUUID();
      const sortOrder = randomInt(1_000_000, 2_000_000_000);

      await pool.query(
        `INSERT INTO categories (id, name, description, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [categoryId, "Тестовая категория", "", sortOrder],
      );

      await pool.query(
        `INSERT INTO products (id, category_id, type, name, description, sort_order)
         VALUES ($1, $2, 'DRINK', $3, $4, $5)`,
        [productId, categoryId, "Тестовый напиток", "", sortOrder],
      );

      await pool.query(
        `INSERT INTO product_variants (product_id, size, price, sort_order)
         VALUES ($1, 'S', 100, $2)`,
        [productId, sortOrder],
      );

      await pool.query(
        `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
         VALUES ($1, $2, 'single', 1, 1)`,
        [groupId, "Тестовая группа"],
      );

      await pool.query(
        `INSERT INTO modifier_options (group_id, name, price_delta, sort_order)
         VALUES ($1, $2, 0, $3)`,
        [groupId, "Бесплатный вариант", sortOrder],
      );

      await pool.query(
        `INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
         VALUES ($1, $2, $3)`,
        [categoryId, groupId, sortOrder],
      );

      await expect(
        pool.query(
          `INSERT INTO categories (name, sort_order) VALUES ('   ', $1)`,
          [sortOrder + 1],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO products (category_id, type, name, price, sort_order)
           VALUES ($1, 'DRINK', 'Цена у напитка', 100, $2)`,
          [categoryId, sortOrder + 1],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO products (category_id, type, name, sort_order)
           VALUES ($1, 'OTHER', 'OTHER без цены', $2)`,
          [categoryId, sortOrder + 2],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO modifier_groups (name, selection_type, min_select, max_select)
           VALUES ('Неверная группа', 'single', 1, 2)`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO modifier_groups (name, selection_type, min_select, max_select)
           VALUES ('Обратные границы', 'multiple', 2, 1)`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO product_variants (product_id, size, price, sort_order)
           VALUES ($1, 'S', 100, $2)`,
          [productId, sortOrder + 1],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      const otherProductId = randomUUID();
      await pool.query(
        `INSERT INTO products (id, category_id, type, name, price, sort_order)
         VALUES ($1, $2, 'OTHER', 'OTHER для проверки варианта', 100, $3)`,
        [otherProductId, categoryId, sortOrder + 3],
      );
      await expect(
        pool.query(
          `INSERT INTO product_variants (product_id, size, price, sort_order)
           VALUES ($1, 'S', 100, $2)`,
          [otherProductId, sortOrder + 2],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO product_variants (product_id, product_type, size, price, sort_order)
           VALUES ($1, 'OTHER', 'M', 100, $2)`,
          [productId, sortOrder + 2],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await pool.query(
        `UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE product_id = $1`,
        [productId],
      );
      await expect(
        pool.query(
          `UPDATE products
           SET type = 'OTHER', price = 100
           WHERE id = $1`,
          [productId],
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        pool.query(
          `INSERT INTO modifier_options (group_id, name, price_delta, sort_order)
           VALUES ($1, 'Повторный порядок', 0, $2)`,
          [groupId, sortOrder],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        pool.query(
          `INSERT INTO modifier_options (group_id, name, price_delta, sort_order)
           VALUES ($1, 'Отрицательная добавка', -1, $2)`,
          [groupId, sortOrder + 1],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    },
    externalProcessTimeoutMs,
  );
});
