import { randomInt, randomUUID } from "node:crypto";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

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
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "проверяет текущую каноническую схему порций",
    async () => {
      const columns = await pool.query<{
        table_name: string;
        column_name: string;
        is_nullable: "YES" | "NO";
      }>(
        `SELECT table_name, column_name, is_nullable
           FROM information_schema.columns
           WHERE table_schema = current_schema()
             AND (
               (table_name = 'products' AND column_name = 'portion_label')
               OR (table_name = 'product_price_choices'
                   AND column_name IN ('id', 'product_id', 'portion_label', 'price', 'sort_order', 'is_available', 'archived_at'))
               OR (table_name = 'order_items' AND column_name IN ('price_choice_id', 'portion_label'))
             )
           ORDER BY table_name, column_name`,
      );
      expect(columns.rows).toEqual([
        {
          table_name: "order_items",
          column_name: "portion_label",
          is_nullable: "YES",
        },
        {
          table_name: "order_items",
          column_name: "price_choice_id",
          is_nullable: "YES",
        },
        {
          table_name: "product_price_choices",
          column_name: "archived_at",
          is_nullable: "YES",
        },
        {
          table_name: "product_price_choices",
          column_name: "id",
          is_nullable: "NO",
        },
        {
          table_name: "product_price_choices",
          column_name: "is_available",
          is_nullable: "NO",
        },
        {
          table_name: "product_price_choices",
          column_name: "portion_label",
          is_nullable: "NO",
        },
        {
          table_name: "product_price_choices",
          column_name: "price",
          is_nullable: "NO",
        },
        {
          table_name: "product_price_choices",
          column_name: "product_id",
          is_nullable: "NO",
        },
        {
          table_name: "product_price_choices",
          column_name: "sort_order",
          is_nullable: "NO",
        },
        {
          table_name: "products",
          column_name: "portion_label",
          is_nullable: "YES",
        },
      ]);
      const rejectedTypedColumns = await pool.query<{ column_name: string }>(
        `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = current_schema()
             AND table_name IN ('product_variants', 'order_items')
             AND column_name IN (
               'portion_kind', 'portion_amount', 'portion_unit',
               'portion_custom_label', 'portion_custom_key',
               'portion_kind_snapshot', 'portion_amount_snapshot',
               'portion_unit_snapshot', 'portion_custom_label_snapshot'
             )`,
      );
      expect(rejectedTypedColumns.rows).toEqual([]);

      await expect(
        pool.query(
          `INSERT INTO categories (name, sort_order) VALUES ('Проверка 0015', 2147480000) RETURNING id`,
        ),
      ).resolves.toMatchObject({ rowCount: 1 });
      const constraints = await pool.query<{
        conname: string;
        convalidated: boolean;
      }>(
        `SELECT conname, convalidated
           FROM pg_constraint
           WHERE connamespace = current_schema()::regnamespace
             AND conname IN (
               'products_portion_label_check',
               'order_items_portion_label_check',
               'order_items_price_choice_id_product_id_fkey'
             )`,
      );
      expect(constraints.rows).toEqual(
        expect.arrayContaining([
          { conname: "products_portion_label_check", convalidated: true },
          { conname: "order_items_portion_label_check", convalidated: true },
          {
            conname: "order_items_price_choice_id_product_id_fkey",
            convalidated: true,
          },
        ]),
      );
      const indexes = await pool.query<{ indexname: string }>(
        `SELECT indexname
           FROM pg_indexes
           WHERE schemaname = current_schema()
             AND tablename = 'product_price_choices'
             AND indexname LIKE 'product_price_choices_current_%_unique'
           ORDER BY indexname`,
      );
      expect(indexes.rows.map(({ indexname }) => indexname)).toEqual([
        "product_price_choices_current_label_unique",
        "product_price_choices_current_sort_unique",
      ]);
    },
    externalProcessTimeoutMs,
  );

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
          `INSERT INTO products (category_id, type, name, price, portion_label, sort_order)
           VALUES ($1, 'DRINK', 'Цена у напитка', 100, '250 мл', $2)`,
          [categoryId, sortOrder + 1],
        ),
      ).resolves.toMatchObject({ rowCount: 1 });
      await expect(
        pool.query(
          `INSERT INTO modifier_groups (name, selection_type, min_select, max_select)
           VALUES ('Неверная группа', 'single', 1, 2)`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      const choiceProductId = randomUUID();
      const firstChoiceId = randomUUID();
      await pool.query(
        `INSERT INTO products (id, category_id, type, name, sort_order)
         VALUES ($1, $2, 'DRINK', 'Напиток с вариантами', $3)`,
        [choiceProductId, categoryId, sortOrder + 2],
      );
      await pool.query(
        `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
         VALUES ($1, $2, '250 мл', 200, 0)`,
        [firstChoiceId, choiceProductId],
      );
      await expect(
        pool.query(
          `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
           VALUES ($1, $2, '  250   МЛ  ', 250, 1)`,
          [randomUUID(), choiceProductId],
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        pool.query(
          `INSERT INTO product_price_choices (id, product_id, portion_label, price, sort_order)
           VALUES ($1, $2, '   ', 250, 1)`,
          [randomUUID(), choiceProductId],
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
