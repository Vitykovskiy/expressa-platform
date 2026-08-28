import type { Pool, PoolClient } from "pg";
import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from "./catalog-advisory-lock.constants";
import { PostgresAdminCatalogRepository } from "./postgres-admin-catalog.repository";

function createRepository(): {
  client: jest.Mocked<PoolClient>;
  pool: jest.Mocked<Pick<Pool, "connect">>;
  query: jest.Mock;
  repository: PostgresAdminCatalogRepository;
} {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const client = {
    query,
    release: jest.fn(),
  } as unknown as jest.Mocked<PoolClient>;
  const pool = { connect: jest.fn().mockResolvedValue(client) } as jest.Mocked<
    Pick<Pool, "connect">
  >;

  return {
    client,
    pool,
    query,
    repository: new PostgresAdminCatalogRepository(pool as unknown as Pool),
  };
}

describe("PostgresAdminCatalogRepository", () => {
  it("читает полный неархивированный каталог под разделяемой блокировкой одним клиентом", async () => {
    const { client, pool, query, repository } = createRepository();
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ value: true, updated_by: null, updated_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "category",
            name: "Кофе",
            description: "Напитки",
            sort_order: 20,
            is_active: false,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "product",
            category_id: "category",
            type: "OTHER",
            name: "Круассан",
            description: "Выпечка",
            price_minor: 22000,
            sort_order: 30,
            is_active: false,
            is_available: false,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "variant",
            product_id: "product",
            size: "M",
            price_minor: 32000,
            sort_order: 40,
            is_available: false,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "group",
            name: "Молоко",
            selection_type: "single",
            min_select: 0,
            max_select: 1,
            is_active: false,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "option",
            group_id: "group",
            name: "Овсяное",
            price_delta_minor: 5000,
            sort_order: 50,
            is_default: false,
            is_available: false,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ category_id: "category", group_id: "group", sort_order: 60 }],
      });

    await expect(repository.findCandidates()).resolves.toEqual({
      intake: { acceptsNewOrders: true, updatedBy: null, updatedAt: null },
      categories: [
        {
          id: "category",
          name: "Кофе",
          description: "Напитки",
          sortOrder: 20,
          isActive: false,
          archivedAt: null,
        },
      ],
      products: [
        {
          id: "product",
          categoryId: "category",
          type: "OTHER",
          name: "Круассан",
          description: "Выпечка",
          priceMinor: 22000,
          sortOrder: 30,
          isActive: false,
          isAvailable: false,
          archivedAt: null,
        },
      ],
      productVariants: [
        {
          id: "variant",
          productId: "product",
          size: "M",
          priceMinor: 32000,
          sortOrder: 40,
          isAvailable: false,
          archivedAt: null,
        },
      ],
      modifierGroups: [
        {
          id: "group",
          name: "Молоко",
          selectionType: "single",
          minSelect: 0,
          maxSelect: 1,
          isActive: false,
          archivedAt: null,
        },
      ],
      modifierOptions: [
        {
          id: "option",
          groupId: "group",
          name: "Овсяное",
          priceDeltaMinor: 5000,
          sortOrder: 50,
          isDefault: false,
          isAvailable: false,
          archivedAt: null,
        },
      ],
      categoryModifierGroups: [
        { categoryId: "category", groupId: "group", sortOrder: 60 },
      ],
    });

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(2, publicMenuAdvisoryLockSql, [
      catalogAdvisoryLockKey,
    ]);
    expect(client.query).toHaveBeenNthCalledWith(10, "COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[4 - 1]?.[0]).toContain(
      "WHERE c.archived_at IS NULL",
    );
    expect(client.query.mock.calls[4 - 1]?.[0]).toContain(
      "ORDER BY c.sort_order",
    );

    expect(client.query.mock.calls[5 - 1]?.[0]).toContain(
      "INNER JOIN categories c ON c.id = p.category_id",
    );
    expect(client.query.mock.calls[5 - 1]?.[0]).toContain(
      "WHERE p.archived_at IS NULL AND c.archived_at IS NULL",
    );
    expect(client.query.mock.calls[5 - 1]?.[0]).toContain(
      "ORDER BY p.category_id, p.sort_order",
    );

    expect(client.query.mock.calls[6 - 1]?.[0]).toContain(
      "INNER JOIN products p ON p.id = v.product_id",
    );
    expect(client.query.mock.calls[6 - 1]?.[0]).toContain(
      "INNER JOIN categories c ON c.id = p.category_id",
    );
    expect(client.query.mock.calls[6 - 1]?.[0]).toContain(
      "WHERE v.archived_at IS NULL AND p.archived_at IS NULL AND c.archived_at IS NULL",
    );
    expect(client.query.mock.calls[6 - 1]?.[0]).toContain(
      "ORDER BY v.product_id, v.sort_order",
    );

    expect(client.query.mock.calls[7 - 1]?.[0]).toContain(
      "WHERE g.archived_at IS NULL",
    );
    expect(client.query.mock.calls[7 - 1]?.[0]).toContain("ORDER BY g.id");

    expect(client.query.mock.calls[8 - 1]?.[0]).toContain(
      "INNER JOIN modifier_groups g ON g.id = o.group_id",
    );
    expect(client.query.mock.calls[8 - 1]?.[0]).toContain(
      "WHERE o.archived_at IS NULL AND g.archived_at IS NULL",
    );
    expect(client.query.mock.calls[8 - 1]?.[0]).toContain(
      "ORDER BY o.group_id, o.sort_order",
    );

    expect(client.query.mock.calls[9 - 1]?.[0]).toContain(
      "INNER JOIN categories c ON c.id = cmg.category_id",
    );
    expect(client.query.mock.calls[9 - 1]?.[0]).toContain(
      "INNER JOIN modifier_groups g ON g.id = cmg.group_id",
    );
    expect(client.query.mock.calls[9 - 1]?.[0]).toContain(
      "WHERE c.archived_at IS NULL AND g.archived_at IS NULL",
    );
    expect(client.query.mock.calls[9 - 1]?.[0]).toContain(
      "ORDER BY cmg.category_id, cmg.sort_order",
    );
  });

  it("откатывает транзакцию и освобождает клиент при ошибке запроса", async () => {
    const { client, query, repository } = createRepository();
    const error = new Error("read failed");
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(error);

    await expect(repository.findCandidates()).rejects.toThrow(error);
    expect(client.query).toHaveBeenNthCalledWith(10, "ROLLBACK");
    expect(client.query).not.toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("откатывает транзакцию при некорректной строке PostgreSQL", async () => {
    const { client, query, repository } = createRepository();
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ value: true, updated_by: null, updated_at: null }],
      })
      .mockResolvedValueOnce({ rows: [{ id: null }] });

    await expect(repository.findCandidates()).rejects.toThrow(
      "Invalid PostgreSQL row field: id",
    );
    expect(client.query).toHaveBeenNthCalledWith(10, "ROLLBACK");
    expect(client.query).not.toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
