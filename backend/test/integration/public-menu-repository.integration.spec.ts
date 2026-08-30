import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";
import { catalogSeed } from "../../scripts/seed.constants";
import {
  catalogAdvisoryLockKey,
  catalogCommandAdvisoryLockSql,
} from "../../src/catalog/adapters/catalog-advisory-lock.constants";
import { PostgresPublicMenuRepository } from "../../src/catalog/adapters/postgres-public-menu.repository";
import { GetPublicMenuUseCase } from "../../src/catalog/application/get-public-menu.use-case";

const databaseUrl = process.env.DATABASE_URL;
const externalProcessTimeoutMs = 30_000;

function runScript(script: "migrate" | "seed"): void {
  execFileSync("npm", ["run", script], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      JEST_WORKER_ID: undefined,
      NODE_ENV: "local",
      PORT: "3000",
      DATABASE_URL: databaseUrl,
      AUTH_ACCESS_TOKEN_SECRET: "public-menu-access-token-secret",
      AUTH_OTP_PEPPER: "public-menu-otp-pepper",
      AUTH_DEVELOPMENT_OTP: "123456",
      CORS_ORIGINS: "http://localhost:5173",
      VAPID_SUBJECT: "mailto:public-menu@expressa.test",
      VAPID_PUBLIC_KEY:
        "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
      VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
    },
    stdio: "inherit",
  });
}

async function resetCatalog(pool: Pool): Promise<void> {
  await pool.query(
    `UPDATE service_settings SET value = true WHERE key = 'accepts_new_orders'`,
  );
  await pool.query(
    `TRUNCATE order_item_modifiers, order_items, order_events, orders, category_modifier_groups, modifier_options,
      modifier_groups, product_variants, products, categories`,
  );
  runScript("seed");
}

async function waitForReaderToWaitForCatalogLock(pool: Pool): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await pool.query<{ is_waiting: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_locks
         WHERE locktype = 'advisory' AND objid = $1 AND NOT granted
       ) AS is_waiting`,
      [catalogAdvisoryLockKey],
    );

    if (result.rows[0]?.is_waiting === true) {
      return;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("Public menu reader did not wait for catalog lock");
}

describe("PostgreSQL repository публичного меню", () => {
  let pool: Pool;
  let useCase: GetPublicMenuUseCase;

  beforeAll(() => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for integration tests");
    }

    pool = new Pool({ connectionString: databaseUrl });
    useCase = new GetPublicMenuUseCase(new PostgresPublicMenuRepository(pool));
    runScript("migrate");
  });

  beforeEach(async () => {
    await resetCatalog(pool);
  });

  afterEach(async () => {
    await resetCatalog(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it(
    "собирает точный опубликованный агрегат канонического seed",
    async () => {
      const [coffee, bakery] = catalogSeed.categories;
      const [cappuccino, espresso, croissant, cheesecake] =
        catalogSeed.products;
      const [
        cappuccinoSmall,
        cappuccinoMedium,
        cappuccinoLarge,
        espressoSmall,
      ] = catalogSeed.productVariants;
      const [milk] = catalogSeed.modifierGroups;
      const [regularMilk, oatMilk] = catalogSeed.modifierOptions;

      await expect(useCase.execute()).resolves.toEqual({
        acceptsNewOrders: true,
        categories: [
          {
            id: coffee?.id,
            name: coffee?.name,
            description: coffee?.description,
            products: [
              {
                id: cappuccino?.id,
                type: "DRINK",
                name: cappuccino?.name,
                description: cappuccino?.description,
                price: null,
                isAvailable: true,
                variants: [
                  {
                    id: cappuccinoSmall?.id,
                    size: "S",
                    price: cappuccinoSmall?.price,
                    isAvailable: true,
                  },
                  {
                    id: cappuccinoMedium?.id,
                    size: "M",
                    price: cappuccinoMedium?.price,
                    isAvailable: true,
                  },
                  {
                    id: cappuccinoLarge?.id,
                    size: "L",
                    price: cappuccinoLarge?.price,
                    isAvailable: true,
                  },
                ],
                modifierGroups: [
                  {
                    id: milk?.id,
                    name: milk?.name,
                    selectionType: "single",
                    minSelect: 1,
                    maxSelect: 1,
                    options: [
                      {
                        id: regularMilk?.id,
                        name: regularMilk?.name,
                        priceDelta: 0,
                        isDefault: true,
                        isAvailable: true,
                      },
                      {
                        id: oatMilk?.id,
                        name: oatMilk?.name,
                        priceDelta: oatMilk?.priceDelta,
                        isDefault: false,
                        isAvailable: true,
                      },
                    ],
                  },
                ],
              },
              {
                id: espresso?.id,
                type: "DRINK",
                name: espresso?.name,
                description: espresso?.description,
                price: null,
                isAvailable: true,
                variants: [
                  {
                    id: espressoSmall?.id,
                    size: "S",
                    price: espressoSmall?.price,
                    isAvailable: true,
                  },
                ],
                modifierGroups: [
                  {
                    id: milk?.id,
                    name: milk?.name,
                    selectionType: "single",
                    minSelect: 1,
                    maxSelect: 1,
                    options: [
                      {
                        id: regularMilk?.id,
                        name: regularMilk?.name,
                        priceDelta: 0,
                        isDefault: true,
                        isAvailable: true,
                      },
                      {
                        id: oatMilk?.id,
                        name: oatMilk?.name,
                        priceDelta: oatMilk?.priceDelta,
                        isDefault: false,
                        isAvailable: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: bakery?.id,
            name: bakery?.name,
            description: bakery?.description,
            products: [
              {
                id: croissant?.id,
                type: "OTHER",
                name: croissant?.name,
                description: croissant?.description,
                price: croissant?.price,
                isAvailable: true,
                variants: [],
                modifierGroups: [],
              },
              {
                id: cheesecake?.id,
                type: "OTHER",
                name: cheesecake?.name,
                description: cheesecake?.description,
                price: cheesecake?.price,
                isAvailable: false,
                variants: [],
                modifierGroups: [],
              },
            ],
          },
        ],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "исключает категорию с товаром без доступных размеров и обязательной группой без корректного default",
    async () => {
      const cappuccino = catalogSeed.products.find(
        (product) => product.name === "Капучино",
      );
      const espresso = catalogSeed.products.find(
        (product) => product.name === "Эспрессо",
      );
      const regularMilk = catalogSeed.modifierOptions.find(
        (option) => option.name === "Обычное молоко",
      );

      if (
        cappuccino === undefined ||
        espresso === undefined ||
        regularMilk === undefined
      ) {
        throw new Error("Catalog seed fixture is incomplete");
      }

      await pool.query(
        `UPDATE product_variants SET is_available = false WHERE product_id IN ($1, $2)`,
        [cappuccino.id, espresso.id],
      );
      await pool.query(
        `UPDATE modifier_options SET price_delta = 1 WHERE id = $1`,
        [regularMilk.id],
      );

      await expect(useCase.execute()).resolves.toEqual({
        acceptsNewOrders: true,
        categories: [expect.objectContaining({ name: "Выпечка" })],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "исключает категорию, когда платная добавка отмечена default в обязательной группе",
    async () => {
      const oatMilk = catalogSeed.modifierOptions.find(
        (option) => option.name === "Овсяное молоко",
      );

      if (oatMilk === undefined) {
        throw new Error("Catalog seed fixture is incomplete");
      }

      await pool.query(
        `UPDATE modifier_options SET is_default = true WHERE id = $1`,
        [oatMilk.id],
      );

      await expect(useCase.execute()).resolves.toEqual({
        acceptsNewOrders: true,
        categories: [expect.objectContaining({ name: "Выпечка" })],
      });
    },
    externalProcessTimeoutMs,
  );

  it(
    "не публикует архивированные элементы и сохраняет порядок sort_order",
    async () => {
      const cappuccino = catalogSeed.products.find(
        (product) => product.name === "Капучино",
      );
      const cheesecake = catalogSeed.products.find(
        (product) => product.name === "Чизкейк",
      );

      if (cappuccino === undefined || cheesecake === undefined) {
        throw new Error("Catalog seed fixture is incomplete");
      }

      await pool.query(
        `UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [cappuccino.id],
      );
      const result = await useCase.execute();

      expect(
        result.categories[0]?.products.map((product) => product.name),
      ).toEqual(["Эспрессо"]);
      expect(
        result.categories[1]?.products.map((product) => product.name),
      ).toEqual(["Круассан", cheesecake.name]);
    },
    externalProcessTimeoutMs,
  );

  it(
    "после ожидания блокировки читает согласованное новое состояние настроек и каталога",
    async () => {
      const coffee = catalogSeed.categories[0];

      if (coffee === undefined) {
        throw new Error("Catalog seed fixture is incomplete");
      }

      const writer = await pool.connect();
      let committed = false;

      try {
        await writer.query("BEGIN");
        await writer.query(catalogCommandAdvisoryLockSql, [
          catalogAdvisoryLockKey,
        ]);
        await writer.query(
          `UPDATE service_settings SET value = false WHERE key = 'accepts_new_orders'`,
        );
        await writer.query(
          `UPDATE categories SET name = 'Кофе после обновления' WHERE id = $1`,
          [coffee.id],
        );

        const reader = useCase.execute();
        await waitForReaderToWaitForCatalogLock(pool);

        await writer.query("COMMIT");
        committed = true;

        await expect(reader).resolves.toMatchObject({
          acceptsNewOrders: false,
          categories: expect.arrayContaining([
            expect.objectContaining({
              id: coffee.id,
              name: "Кофе после обновления",
            }),
          ]),
        });
      } finally {
        if (!committed) {
          await writer.query("ROLLBACK");
        }

        writer.release();
      }
    },
    externalProcessTimeoutMs,
  );
});
