import { describe, expect, it } from "vitest";

import { ApiClient, ApiError } from "./client";
import { createPublicMenuApi } from "./public-menu.api";

const response = {
  acceptsNewOrders: true,
  categories: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Кофе",
      description: "",
      products: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          name: "Капучино",
          description: "",
          price: null,
          portionLabel: null,
          isAvailable: true,
          priceChoices: [
            {
              id: "00000000-0000-4000-8000-000000000003",
              portionLabel: "250 мл",
              price: 300,
              isAvailable: true,
            },
            {
              id: "00000000-0000-4000-8000-000000000004",
              portionLabel: "350 мл",
              price: 350,
              isAvailable: false,
            },
          ],
          modifierGroups: [],
        },
      ],
    },
  ],
};

describe("PublicMenuApi", () => {
  it("keeps v3 plain portion labels and ordered price choices without parsing", async () => {
    const menu = await createPublicMenuApi(client(response)).getMenu();

    expect(menu).toEqual(response);
  });

  it("rejects a price choice when a product has a direct price", async () => {
    await expect(
      createPublicMenuApi(
        client({
          ...response,
          categories: [
            {
              ...response.categories[0],
              products: [{ ...response.categories[0].products[0], price: 300 }],
            },
          ],
        }),
      ).getMenu(),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });
});

function client(value: unknown): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v3",
    fetcher: async () => new Response(JSON.stringify(value), { status: 200 }),
  });
}
