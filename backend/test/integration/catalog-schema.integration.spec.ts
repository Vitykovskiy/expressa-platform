import { randomInt, randomUUID } from "node:crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

describe("схема каталога", () => {
  let pool: Pool;

  beforeAll(() => {
    if (databaseUrl === undefined)
      throw new Error("DATABASE_URL is required for integration tests");
    pool = new Pool({ connectionString: databaseUrl });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "содержит только канонические цены товара",
    async () => {
      const tables = await pool.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = current_schema()
           AND table_name IN ('product_price_choices', 'product_variants')
         ORDER BY table_name`,
      );
      expect(tables.rows).toEqual([{ table_name: "product_price_choices" }]);

      const columns = await pool.query<{
        column_name: string;
        is_nullable: "YES" | "NO";
      }>(
        `SELECT column_name, is_nullable FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'product_price_choices'
           AND column_name IN ('id', 'product_id', 'portion_label', 'price', 'sort_order', 'is_available', 'archived_at')
         ORDER BY column_name`,
      );
      expect(columns.rows).toEqual([
        { column_name: "archived_at", is_nullable: "YES" },
        { column_name: "id", is_nullable: "NO" },
        { column_name: "is_available", is_nullable: "NO" },
        { column_name: "portion_label", is_nullable: "NO" },
        { column_name: "price", is_nullable: "NO" },
        { column_name: "product_id", is_nullable: "NO" },
        { column_name: "sort_order", is_nullable: "NO" },
      ]);
    },
    externalProcessTimeoutMs,
  );

  it(
    "проверяет инварианты цены, групп модификаторов и связей каталога",
    async () => {
      const categoryId = randomUUID();
      const productId = randomUUID();
      const groupId = randomUUID();
      const sortOrder = randomInt(1_000_000, 2_000_000_000);
      await pool.query(
        `INSERT INTO categories (id, name, description, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [categoryId, "Тестовая категория", "", sortOrder],
      );
      await pool.query(
        `INSERT INTO products (id, category_id, name, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, categoryId, "Тестовый напиток", "", sortOrder],
      );
      await pool.query(
        `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
         VALUES ($1, $2, '250 мл', 200, 0)`,
        [randomUUID(), productId],
      );
      await expect(
        pool.query(
          `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
           VALUES ($1, $2, '  250   МЛ  ', 250, 1)`,
          [randomUUID(), productId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        pool.query(
          `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
           VALUES ($1, $2, '   ', 250, 1)`,
          [randomUUID(), productId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        pool.query(
          `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
           VALUES ($1, 'Неверная группа', 'single', 1, 2)`,
          [groupId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    },
    externalProcessTimeoutMs,
  );
});
