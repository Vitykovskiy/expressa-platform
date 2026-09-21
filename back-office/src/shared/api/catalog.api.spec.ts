import { describe, expect, it, vi } from "vitest";

import { CatalogApi } from "./catalog.api";
import { ApiClient } from "./client";

const categoryId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const priceChoiceId = "33333333-3333-4333-8333-333333333333";

const catalogResponse = {
  categories: [
    {
      id: categoryId,
      name: "Кофе",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  ],
  products: [
    {
      id: productId,
      categoryId,
      name: "Капучино",
      description: "",
      price: null,
      portionLabel: null,
      priceChoices: [
        {
          id: priceChoiceId,
          portionLabel: "250 мл",
          price: 300,
          sortOrder: 0,
          isAvailable: true,
        },
      ],
      sortOrder: 0,
      isActive: true,
      isAvailable: true,
    },
  ],
  modifierGroups: [],
  modifierOptions: [],
  categoryModifierGroups: [],
};

describe("CatalogApi", () => {
  it("reads the v3 catalog and preserves ordered price choices", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(catalogResponse), { status: 200 }),
      );
    const api = new CatalogApi(
      new ApiClient({ baseUrl: "https://api.example.test/api/v3", fetcher }),
    );

    await expect(api.getCatalog("access-token")).resolves.toMatchObject({
      products: [
        {
          id: productId,
          priceChoices: [{ id: priceChoiceId, portionLabel: "250 мл" }],
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v3/backoffice/catalog",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
