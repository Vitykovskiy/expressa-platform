import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Pool } from "pg";
import {
  catalogSeed,
  customerMenuCatalogSeed,
} from "../../scripts/seed.constants";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;
const bootstrapAdministratorPhone = "+79991234567";

function runScript(
  script: "seed",
  nodeEnv: "development" | "local" = "local",
): void {
  execFileSync("npm", ["run", script], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: nodeEnv,
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      BOOTSTRAP_ADMIN_PHONE: bootstrapAdministratorPhone,
      AUTH_ACCESS_TOKEN_SECRET: "catalog-seed-access-token-secret",
      AUTH_OTP_PEPPER: "catalog-seed-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:catalog-seed@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
    },
    stdio: "inherit",
  });
}

async function readCatalogState(pool: Pool): Promise<object> {
  const result = await pool.query<{ state: object }>(
    `SELECT jsonb_build_object(
      'categories', (SELECT jsonb_agg(row_to_json(categories) ORDER BY id) FROM categories),
      'products', (SELECT jsonb_agg(row_to_json(products) ORDER BY id) FROM products),
      'productVariants', (SELECT jsonb_agg(row_to_json(product_variants) ORDER BY id) FROM product_variants),
      'productPriceChoices', (SELECT jsonb_agg(row_to_json(product_price_choices) ORDER BY id) FROM product_price_choices),
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
    throw new Error("Catalog state was not read");
  }

  return state;
}

describe("seed каталога", () => {
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
    "восстанавливает канонический каталог повторным seed и сохраняет пользователей",
    async () => {
      const preservedPhone =
        "+7999" +
        Math.floor(Math.random() * 10_000_000)
          .toString()
          .padStart(7, "0");
      const cappuccino = catalogSeed.products.find(
        (product) => product.name === "Капучино",
      );

      if (cappuccino === undefined) {
        throw new Error("Cappuccino fixture is required");
      }

      await pool.query(
        `INSERT INTO users (id, phone_e164, role) VALUES ($1, $2, 'barista')`,
        [randomUUID(), preservedPhone],
      );
      runScript("seed");
      const firstState = await readCatalogState(pool);

      await pool.query(
        `UPDATE products SET name = 'Изменённый товар', is_available = false WHERE id = $1`,
        [cappuccino.id],
      );
      runScript("seed");
      const secondState = await readCatalogState(pool);
      const preservedUser = await pool.query<{
        phone_e164: string;
        role: string;
      }>("SELECT phone_e164, role FROM users WHERE phone_e164 = $1", [
        preservedPhone,
      ]);

      expect(secondState).toEqual(firstState);
      expect(preservedUser.rows).toEqual([
        { phone_e164: preservedPhone, role: "barista" },
      ]);
      expect(firstState).toMatchObject({
        categories: expect.arrayContaining([
          expect.objectContaining({ name: "Кофе", is_active: true }),
        ]),
        products: expect.arrayContaining([
          expect.objectContaining({
            name: "Капучино",
            type: "DRINK",
            is_available: true,
          }),
          expect.objectContaining({
            name: "Эспрессо",
            type: "DRINK",
            is_available: true,
          }),
          expect.objectContaining({
            name: "Круассан",
            type: "OTHER",
            is_available: true,
          }),
          expect.objectContaining({
            name: "Чизкейк",
            type: "OTHER",
            is_available: false,
          }),
          expect.objectContaining({
            name: "Тестовый напиток",
            type: "DRINK",
            is_active: false,
          }),
        ]),
        productVariants: expect.arrayContaining([
          expect.objectContaining({ size: "S" }),
          expect.objectContaining({ size: "M" }),
          expect.objectContaining({ size: "L" }),
        ]),
        modifierGroups: expect.arrayContaining([
          expect.objectContaining({
            name: "Молоко",
            min_select: 1,
            max_select: 1,
          }),
        ]),
        modifierOptions: expect.arrayContaining([
          expect.objectContaining({
            name: "Обычное молоко",
            price_delta: 0,
            is_default: true,
          }),
        ]),
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "converges the development customer menu as direct prices and ordered price choices",
    () => {
      runScript("seed", "development");
      const firstChoices = pool.query<{
        id: string;
        product_id: string;
        portion_label: string;
        price: number;
        sort_order: number;
        is_available: boolean;
      }>(
        `SELECT id, product_id, portion_label, price, sort_order, is_available
         FROM product_price_choices
         WHERE id = ANY($1::uuid[]) AND archived_at IS NULL
         ORDER BY product_id, sort_order`,
        [
          customerMenuCatalogSeed.productPriceChoices.map(
            (choice) => choice.id,
          ),
        ],
      );

      return firstChoices.then(async (choices) => {
        expect(choices.rows).toEqual(
          [...customerMenuCatalogSeed.productPriceChoices]
            .sort(
              (left, right) =>
                left.productId.localeCompare(right.productId) ||
                left.sortOrder - right.sortOrder,
            )
            .map((choice) => ({
              id: choice.id,
              product_id: choice.productId,
              portion_label: choice.portionLabel,
              price: choice.price,
              sort_order: choice.sortOrder,
              is_available: choice.isAvailable,
            })),
        );

        const directProducts = await pool.query<{
          id: string;
          display_label: string | null;
          price: number;
          is_available: boolean;
        }>(
          `SELECT id, display_label, price, is_available
           FROM products
           WHERE id = ANY($1::uuid[]) AND archived_at IS NULL AND price IS NOT NULL
           ORDER BY id`,
          [
            customerMenuCatalogSeed.products
              .filter((product) => product.price !== null)
              .map((product) => product.id),
          ],
        );
        expect(directProducts.rows).toEqual(
          customerMenuCatalogSeed.products
            .filter(
              (product): product is typeof product & { price: number } =>
                product.price !== null,
            )
            .sort((left, right) => left.id.localeCompare(right.id))
            .map((product) => ({
              id: product.id,
              display_label: product.displayLabel ?? null,
              price: product.price,
              is_available: product.isAvailable,
            })),
        );

        const shape = await pool.query<{
          direct_products: number;
          labelled_direct_products: number;
          multi_products: number;
          price_choices: number;
        }>(
          `SELECT
             COUNT(*) FILTER (WHERE price IS NOT NULL)::int AS direct_products,
             COUNT(*) FILTER (WHERE price IS NOT NULL AND display_label IS NOT NULL)::int AS labelled_direct_products,
             COUNT(*) FILTER (WHERE id IN (SELECT DISTINCT product_id FROM product_price_choices WHERE archived_at IS NULL))::int AS multi_products,
             (SELECT COUNT(*)::int FROM product_price_choices WHERE id = ANY($2::uuid[]) AND archived_at IS NULL) AS price_choices
           FROM products
           WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
          [
            customerMenuCatalogSeed.products.map((product) => product.id),
            customerMenuCatalogSeed.productPriceChoices.map(
              (choice) => choice.id,
            ),
          ],
        );
        expect(shape.rows).toEqual([
          {
            direct_products: 23,
            labelled_direct_products: 19,
            multi_products: 10,
            price_choices: 20,
          },
        ]);

        runScript("seed", "development");

        const convergence = await pool.query<{
          direct_products: number;
          price_choices: number;
        }>(
          `SELECT
             (SELECT COUNT(*)::int FROM products WHERE id = ANY($1::uuid[]) AND archived_at IS NULL AND price IS NOT NULL) AS direct_products,
             (SELECT COUNT(*)::int FROM product_price_choices WHERE id = ANY($2::uuid[]) AND archived_at IS NULL) AS price_choices`,
          [
            customerMenuCatalogSeed.products.map((product) => product.id),
            customerMenuCatalogSeed.productPriceChoices.map(
              (choice) => choice.id,
            ),
          ],
        );
        expect(convergence.rows).toEqual([
          {
            direct_products: 23,
            price_choices: 20,
          },
        ]);
      });
    },
    externalProcessTimeoutMs,
  );
});
