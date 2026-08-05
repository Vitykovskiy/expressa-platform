import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { AppModule } from "../../src/app.module";
import { migrateDatabase } from "../../src/platform/database/migrations";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";

const databaseUrl = process.env.DATABASE_URL;
const categoryId = randomUUID();
const productId = randomUUID();
const variantId = randomUUID();
const groupId = randomUUID();
const optionId = randomUUID();

describe("public menu E2E", () => {
  let app: INestApplication;
  let pool: Pool;
  let url: string;

  beforeAll(async () => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for e2e tests");
    }

    pool = new Pool({ connectionString: databaseUrl });
    await migrateDatabase(pool, "migrations");
    await resetCatalog(pool);
    await seedPublicMenu(pool);

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureHttp(app, "local");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await app?.close();
    await resetCatalog(pool);
    await pool?.end();
  });

  it("возвращает без авторизации каноническое вложенное меню", async () => {
    const response = await fetch(`${url}/api/v1/public/menu`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [
        {
          id: categoryId,
          name: "Кофе",
          description: "Напитки",
          products: [
            {
              id: productId,
              type: "DRINK",
              name: "Капучино",
              description: "Кофе с молоком",
              priceMinor: null,
              isAvailable: true,
              variants: [
                {
                  id: variantId,
                  size: "M",
                  priceMinor: 32_000,
                  isAvailable: true,
                },
              ],
              modifierGroups: [
                {
                  id: groupId,
                  name: "Молоко",
                  selectionType: "single",
                  minSelect: 1,
                  maxSelect: 1,
                  options: [
                    {
                      id: optionId,
                      name: "Обычное",
                      priceDeltaMinor: 0,
                      isDefault: true,
                      isAvailable: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});

async function seedPublicMenu(pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO categories (id, name, description, sort_order)
     VALUES ($1, 'Кофе', 'Напитки', 10)`,
    [categoryId],
  );
  await pool.query(
    `INSERT INTO products (id, category_id, type, name, description, price_minor, sort_order)
     VALUES ($1, $2, 'DRINK', 'Капучино', 'Кофе с молоком', NULL, 10)`,
    [productId, categoryId],
  );
  await pool.query(
    `INSERT INTO product_variants (id, product_id, size, price_minor, sort_order)
     VALUES ($1, $2, 'M', 32000, 10)`,
    [variantId, productId],
  );
  await pool.query(
    `INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select)
     VALUES ($1, 'Молоко', 'single', 1, 1)`,
    [groupId],
  );
  await pool.query(
    `INSERT INTO modifier_options (id, group_id, name, price_delta_minor, sort_order, is_default)
     VALUES ($1, $2, 'Обычное', 0, 10, true)`,
    [optionId, groupId],
  );
  await pool.query(
    `INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
     VALUES ($1, $2, 10)`,
    [categoryId, groupId],
  );
}

async function resetCatalog(pool: Pool): Promise<void> {
  await pool.query("DELETE FROM order_item_modifiers");
  await pool.query("DELETE FROM order_items");
  await pool.query("DELETE FROM orders");
  await pool.query("DELETE FROM order_daily_counters");
  await pool.query("DELETE FROM category_modifier_groups");
  await pool.query("DELETE FROM modifier_options");
  await pool.query("DELETE FROM product_variants");
  await pool.query("DELETE FROM products");
  await pool.query("DELETE FROM modifier_groups");
  await pool.query("DELETE FROM categories");
}
