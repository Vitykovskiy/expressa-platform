import type { Pool } from "pg";
import { PostgresAdminCatalogRepository } from "./postgres-admin-catalog.repository";

describe("PostgresAdminCatalogRepository", () => {
  it("читает v3-каталог с ценами товара", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: "category",
            name: "Кофе",
            description: "Напитки",
            sort_order: 20,
            is_active: true,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "product",
            category_id: "category",
            name: "Круассан",
            description: "Выпечка",
            portion_label: null,
            price: 220,
            sort_order: 30,
            is_active: true,
            is_available: true,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "price-choice",
            product_id: "product",
            portion_label: "250 мл",
            price: 320,
            sort_order: 40,
            is_available: true,
            archived_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const repository = new PostgresAdminCatalogRepository({
      query,
    } as unknown as Pool);

    await expect(repository.findV3Candidates()).resolves.toEqual({
      categories: [
        {
          id: "category",
          name: "Кофе",
          description: "Напитки",
          sortOrder: 20,
          isActive: true,
          archivedAt: null,
        },
      ],
      products: [
        {
          id: "product",
          categoryId: "category",
          name: "Круассан",
          description: "Выпечка",
          portionLabel: null,
          price: 220,
          sortOrder: 30,
          isActive: true,
          isAvailable: true,
          archivedAt: null,
        },
      ],
      priceChoices: [
        {
          id: "price-choice",
          productId: "product",
          portionLabel: "250 мл",
          price: 320,
          sortOrder: 40,
          isAvailable: true,
          archivedAt: null,
        },
      ],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
    });

    expect(query.mock.calls[2]?.[0]).toContain("product_price_choices");
  });
});
