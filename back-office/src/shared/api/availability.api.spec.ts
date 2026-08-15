import { describe, expect, it, vi } from "vitest";

import { AvailabilityApi } from "./availability.api";
import type { AvailabilityResponseDto } from "./availability.api.types";
import { ApiClient } from "./client";

const categoryId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const variantId = "33333333-3333-4333-8333-333333333333";
const modifierGroupId = "44444444-4444-4444-8444-444444444444";
const modifierId = "55555555-5555-4555-8555-555555555555";
const staffId = "66666666-6666-4666-8666-666666666666";

function createAvailabilityApi(fetcher: typeof fetch): AvailabilityApi {
  return new AvailabilityApi(
    new ApiClient({ baseUrl: "https://api.example.test/api/v1", fetcher }),
  );
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}

function availabilityResponse(): AvailabilityResponseDto {
  return {
    categories: [
      {
        id: categoryId,
        isActive: true,
        name: "Кофе",
        sortOrder: 0,
      },
    ],
    categoryModifierGroups: [
      { categoryId, groupId: modifierGroupId, sortOrder: 0 },
    ],
    intake: {
      acceptsNewOrders: true,
      updatedAt: "2030-01-01T10:00:00.000Z",
      updatedBy: staffId,
    },
    modifierGroups: [{ id: modifierGroupId, isActive: true, name: "Молоко" }],
    modifierOptions: [
      {
        groupId: modifierGroupId,
        id: modifierId,
        isAvailable: true,
        name: "Овсяное",
        sortOrder: 0,
      },
    ],
    productVariants: [
      {
        id: variantId,
        isAvailable: false,
        productId,
        size: "M",
        sortOrder: 0,
      },
    ],
    products: [
      {
        categoryId,
        id: productId,
        isActive: true,
        isAvailable: true,
        name: "Капучино",
        sortOrder: 0,
      },
    ],
  };
}

describe("AvailabilityApi", () => {
  it("преобразует staff aggregate в категории, позиции и приём заказов", async () => {
    const api = createAvailabilityApi(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(availabilityResponse(), 200)),
    );

    await expect(api.get("access-token")).resolves.toEqual({
      groups: [
        {
          id: categoryId,
          items: [
            {
              id: productId,
              isAvailable: true,
              label: "Капучино",
              sublabel: "Товар",
              type: "product",
            },
            {
              id: variantId,
              isAvailable: false,
              label: "Капучино · M",
              sublabel: "Размер",
              type: "variant",
            },
            {
              id: modifierId,
              isAvailable: true,
              label: "Молоко · Овсяное",
              sublabel: "Добавка",
              type: "modifier",
            },
          ],
          name: "Кофе",
          sortOrder: 0,
        },
      ],
      intake: availabilityResponse().intake,
    });
  });

  it("отправляет команды доступности и приёма с bearer token", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { id: productId, isAvailable: false, type: "product" },
          200,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            acceptsNewOrders: false,
            updatedAt: "2030-01-01T10:00:00.000Z",
            updatedBy: staffId,
          },
          200,
        ),
      );
    const api = createAvailabilityApi(fetcher);

    await expect(
      api.update("access-token", "product", productId, false),
    ).resolves.toMatchObject({ isAvailable: false });
    await expect(
      api.updateIntake("access-token", false),
    ).resolves.toMatchObject({ acceptsNewOrders: false });

    const [availabilityUrl, availabilityRequest] = fetcher.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const [intakeUrl, intakeRequest] = fetcher.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(availabilityUrl).toBe(
      `https://api.example.test/api/v1/backoffice/availability/product/${productId}`,
    );
    expect(availabilityRequest).toMatchObject({
      body: JSON.stringify({ isAvailable: false }),
      headers: { authorization: "Bearer access-token" },
      method: "PATCH",
    });
    expect(intakeUrl).toBe(
      "https://api.example.test/api/v1/backoffice/service/intake",
    );
    expect(intakeRequest.body).toBe(
      JSON.stringify({ acceptsNewOrders: false }),
    );
  });

  it("не принимает aggregate с неизвестной связью", async () => {
    const response = availabilityResponse();
    const api = createAvailabilityApi(
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            ...response,
            products: [{ ...response.products[0], categoryId: staffId }],
          },
          200,
        ),
      ),
    );

    await expect(api.get("access-token")).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    });
  });
});
