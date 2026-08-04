import { describe, expect, it } from "vitest";

import { ApiClient, ApiError } from "./client";
import { createPublicMenuApi } from "./public-menu.api";

describe("PublicMenuApi", () => {
  it("запрашивает публичное меню exact GET 200 и преобразует вложенные данные", async () => {
    const calls: RequestInit[] = [];
    const menu = await createPublicMenuApi(
      client(menuResponse, calls),
    ).getMenu();

    expect(calls).toEqual([expect.objectContaining({ method: "GET" })]);
    expect(menu).toEqual(menuResponse);
    expect(menu.categories[0]?.products[0]?.type).toBe("DRINK");
    expect(menu.categories[0]?.products[1]?.type).toBe("OTHER");
  });

  it.each([
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[0],
              priceMinor: 30000,
            },
          ],
        },
      ],
    },
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[1],
              variants: [menuResponse.categories[0]!.products[0]!.variants[0]],
            },
          ],
        },
      ],
    },
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[0],
              modifierGroups: [
                {
                  ...menuResponse.categories[0]!.products[0]!.modifierGroups[0],
                  selectionType: "single",
                  maxSelect: 2,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[0],
              variants: [],
            },
          ],
        },
      ],
    },
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[0],
              variants: [
                menuResponse.categories[0]!.products[0]!.variants[0],
                menuResponse.categories[0]!.products[0]!.variants[0],
              ],
            },
          ],
        },
      ],
    },
    {
      ...menuResponse,
      categories: [
        {
          ...menuResponse.categories[0],
          products: [
            {
              ...menuResponse.categories[0]!.products[0],
              variants: menuResponse.categories[0]!.products[0]!.variants.map(
                (variant) => ({ ...variant, isAvailable: false }),
              ),
            },
          ],
        },
      ],
    },
  ])("отклоняет нарушенный вложенный контракт", async (response) => {
    await expect(
      createPublicMenuApi(client(response)).getMenu(),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });

  it("отклоняет успешный статус, отличный от 200", async () => {
    await expect(
      createPublicMenuApi(client(menuResponse, [], 201)).getMenu(),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      status: 201,
    } satisfies Partial<ApiError>);
  });
});

const menuResponse = {
  acceptsNewOrders: true,
  categories: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Кофе",
      description: "Горячие напитки",
      products: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          type: "DRINK" as const,
          name: "Капучино",
          description: "Классический",
          priceMinor: null,
          isAvailable: true,
          variants: [
            {
              id: "00000000-0000-4000-8000-000000000003",
              size: "M" as const,
              priceMinor: 30000,
              isAvailable: true,
            },
          ],
          modifierGroups: [
            {
              id: "00000000-0000-4000-8000-000000000004",
              name: "Молоко",
              selectionType: "single" as const,
              minSelect: 1,
              maxSelect: 1,
              options: [
                {
                  id: "00000000-0000-4000-8000-000000000005",
                  name: "Обычное",
                  priceDeltaMinor: 0,
                  isDefault: true,
                  isAvailable: true,
                },
              ],
            },
          ],
        },
        {
          id: "00000000-0000-4000-8000-000000000006",
          type: "OTHER" as const,
          name: "Круассан",
          description: "С маслом",
          priceMinor: 18000,
          isAvailable: true,
          variants: [],
          modifierGroups: [],
        },
      ],
    },
  ],
};

function client(
  response: unknown,
  capture: RequestInit[] = [],
  status = 200,
): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v1",
    fetcher: async (_url, options) => {
      capture.push(options ?? {});

      return new Response(JSON.stringify(response), { status });
    },
  });
}
