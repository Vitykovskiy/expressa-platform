import type { Pool, PoolClient } from "pg";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import { PostgresProductsRepository } from "./postgres-products.repository";

describe("PostgresProductsRepository", () => {
  it("сохраняет аудит товара в той же транзакции", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const pool = {
      connect: jest.fn().mockResolvedValue(client),
    } as unknown as Pool;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner(pool),
    );
    await repository.run(
      async () => undefined,
      (transaction) =>
        transaction.writeAudit({
          actorId: "actor",
          requestId: "request",
          action: "PRODUCT_CREATED",
          productId: "product",
          before: null,
          after: null,
        }),
    );
    expect(query.mock.calls[2]).toEqual([
      expect.stringContaining("INSERT INTO audit_events"),
      ["actor", "product", "PRODUCT_CREATED", "null", "null", "request"],
    ]);
  });
  it("создаёт, изменяет, переупорядочивает и архивирует товар", async () => {
    const row = {
      id: "product",
      category_id: "category",
      type: "OTHER",
      name: "Печенье",
      description: "",
      price_minor: 100,
      sort_order: 0,
      is_active: true,
      is_available: true,
      archived_at: null,
    };
    const query = jest.fn((sql: string) => {
      if (
        sql.includes("INSERT INTO products") ||
        sql.includes("UPDATE products SET archived_at")
      )
        return Promise.resolve({ rows: [{ id: "product" }] });
      if (sql.includes("SELECT id, category_id"))
        return Promise.resolve({ rows: [row] });
      if (sql.includes("SELECT id, product_id"))
        return Promise.resolve({ rows: [] });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner({
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool),
    );
    const details = {
      categoryId: "category",
      type: "OTHER" as const,
      name: "Печенье",
      description: "",
      priceMinor: 100,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      variants: [],
    };
    await expect(
      repository.run(
        (transaction) => transaction.create(details),
        async () => undefined,
      ),
    ).resolves.toMatchObject({ id: "product" });
    await expect(
      repository.run(
        (transaction) => transaction.update("product", details),
        async () => undefined,
      ),
    ).resolves.toMatchObject({ id: "product" });
    const current = {
      id: "product",
      categoryId: "category",
      type: "OTHER" as const,
      name: "Печенье",
      description: "",
      priceMinor: 100,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      archivedAt: null,
      variants: [],
    };
    await expect(
      repository.run(
        (transaction) => transaction.reorder([current], ["product"]),
        async () => undefined,
      ),
    ).resolves.toHaveLength(1);
    await expect(
      repository.run(
        (transaction) => transaction.archive("product"),
        async () => undefined,
      ),
    ).resolves.toMatchObject({ id: "product" });
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes("SET is_active = false"),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes("UPDATE product_variants SET archived_at"),
      ),
    ).toBe(true);
  });
  it("откатывает команду при ошибке репозитория", async () => {
    const query = jest.fn((sql: string) =>
      sql === "BEGIN"
        ? Promise.resolve({ rows: [] })
        : sql.includes("pg_advisory_xact_lock")
          ? Promise.resolve({ rows: [] })
          : Promise.reject(new Error("database failed")),
    );
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner({
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool),
    );
    await expect(
      repository.run(
        (transaction) => transaction.categoryExists("category"),
        async () => undefined,
      ),
    ).rejects.toThrow("database failed");
    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
  it("сохраняет все размеры DRINK и отображает только товары выбранной категории", async () => {
    const product = {
      id: "drink",
      category_id: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "",
      price_minor: null,
      sort_order: 0,
      is_active: true,
      is_available: true,
      archived_at: null,
    };
    const variants = ["S", "M", "L"].map((size, sortOrder) => ({
      id: size,
      product_id: "drink",
      size,
      price_minor: 100 + sortOrder,
      sort_order: sortOrder,
      is_available: true,
      archived_at: null,
    }));
    const query = jest.fn((sql: string) => {
      if (sql.includes("INSERT INTO products"))
        return Promise.resolve({ rows: [{ id: "drink" }] });
      if (sql.includes("SELECT id, category_id"))
        return Promise.resolve({ rows: [product] });
      if (sql.includes("SELECT id, product_id"))
        return Promise.resolve({ rows: variants });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner({
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool),
    );
    const details = {
      categoryId: "coffee",
      type: "DRINK" as const,
      name: "Капучино",
      description: "",
      priceMinor: null,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      variants: variants.map(
        ({ size, price_minor, sort_order, is_available }) => ({
          size: size as "S" | "M" | "L",
          priceMinor: price_minor,
          sortOrder: sort_order,
          isAvailable: is_available,
        }),
      ),
    };
    await expect(
      repository.run(
        (transaction) => transaction.create(details),
        async () => undefined,
      ),
    ).resolves.toMatchObject({
      variants: variants.map(({ id, size }) => ({ id, size })),
    });
    await expect(
      repository.run(
        (transaction) => transaction.findCurrentByCategory("coffee"),
        async () => undefined,
      ),
    ).resolves.toMatchObject([
      { id: "drink", variants: variants.map(({ size }) => ({ size })) },
    ]);
    expect(
      query.mock.calls.filter(([sql]) =>
        String(sql).includes("INSERT INTO product_variants"),
      ),
    ).toHaveLength(3);
  });
  it("двухфазно синхронизирует variants по size без замены UUID", async () => {
    const product = {
      id: "drink",
      category_id: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "",
      price_minor: null,
      sort_order: 0,
      is_active: true,
      is_available: true,
      archived_at: null,
    };
    const variants = [
      {
        id: "variant-m",
        product_id: "drink",
        size: "M",
        price_minor: 450,
        sort_order: 1,
        is_available: true,
        archived_at: null,
      },
      {
        id: "variant-l",
        product_id: "drink",
        size: "L",
        price_minor: 500,
        sort_order: 2,
        is_available: false,
        archived_at: null,
      },
    ];
    const query = jest.fn((sql: string) => {
      if (sql.includes("SELECT id, category_id"))
        return Promise.resolve({ rows: [product] });
      if (sql.includes("SELECT id, product_id"))
        return Promise.resolve({ rows: variants });
      return Promise.resolve({ rows: [] });
    });
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner({
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool),
    );
    const details = {
      categoryId: "coffee",
      type: "DRINK" as const,
      name: "Капучино",
      description: "",
      priceMinor: null,
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
      variants: [
        {
          size: "M" as const,
          priceMinor: 450,
          sortOrder: 1,
          isAvailable: true,
        },
        {
          size: "L" as const,
          priceMinor: 500,
          sortOrder: 2,
          isAvailable: false,
        },
      ],
    };

    await expect(
      repository.run(
        (transaction) => transaction.update("drink", details),
        async () => undefined,
      ),
    ).resolves.toMatchObject({
      variants: [
        { id: "variant-m", size: "M" },
        { id: "variant-l", size: "L" },
      ],
    });

    expect(query).toHaveBeenCalledWith(
      "UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE product_id = $1 AND archived_at IS NULL",
      ["drink"],
    );
    expect(
      query.mock.calls.filter(([sql]) =>
        String(sql).includes(
          "SET size = $2, price_minor = $3, sort_order = $4, is_available = $5, archived_at = NULL",
        ),
      ),
    ).toHaveLength(2);
  });
  it("отклоняет недопустимый размер из PostgreSQL", async () => {
    const product = {
      id: "drink",
      category_id: "coffee",
      type: "DRINK",
      name: "Капучино",
      description: "",
      price_minor: null,
      sort_order: 0,
      is_active: true,
      is_available: true,
      archived_at: null,
    };
    const variant = {
      id: "xl",
      product_id: "drink",
      size: "XL",
      price_minor: 100,
      sort_order: 0,
      is_available: true,
      archived_at: null,
    };
    const query = jest.fn((sql: string) =>
      Promise.resolve({
        rows: sql.includes("SELECT id, category_id")
          ? [product]
          : sql.includes("SELECT id, product_id")
            ? [variant]
            : [],
      }),
    );
    const client = { query, release: jest.fn() } as unknown as PoolClient;
    const repository = new PostgresProductsRepository(
      new PostgresCatalogCommandRunner({
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool),
    );
    await expect(
      repository.run(
        (transaction) => transaction.findCurrentByCategory("coffee"),
        async () => undefined,
      ),
    ).rejects.toThrow("Invalid PostgreSQL row field: size");
  });
});
