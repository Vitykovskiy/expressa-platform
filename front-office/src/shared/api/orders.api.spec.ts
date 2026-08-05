import { describe, expect, it } from "vitest";

import { ApiClient, ApiError } from "./client";
import { createOrdersApi } from "./orders.api";

describe("OrdersApi", () => {
  it("отправляет exact POST 201 с bearer, UUID-ключом и телом заказа", async () => {
    const calls: RequestInit[] = [];
    const order = await createOrdersApi(
      client(orderResponse, calls),
    ).createOrder("access-token", createOrderRequest, idempotencyKey);

    expect(calls).toEqual([
      expect.objectContaining({
        body: JSON.stringify(createOrderRequest),
        headers: {
          authorization: "Bearer access-token",
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        method: "POST",
      }),
    ]);
    expect(order).toEqual(orderResponse);
    expect(order).not.toBe(orderResponse);
    expect(order.items[0]).not.toBe(orderResponse.items[0]);
    expect(order.items[0]?.modifiers[0]).not.toBe(
      orderResponse.items[0]?.modifiers[0],
    );
  });

  it("принимает снимок с nullable variantId и size", async () => {
    const response = {
      ...orderResponse,
      items: [
        {
          ...orderResponse.items[0],
          modifiers: [],
          size: null,
          variantId: null,
        },
      ],
    };

    await expect(
      createOrdersApi(client(response)).createOrder(
        "access-token",
        createOrderRequest,
        idempotencyKey,
      ),
    ).resolves.toEqual(response);
  });

  it.each(invalidOrderResponses)(
    "отклоняет снимок: $name",
    async ({ response }) => {
      await expect(
        createOrdersApi(client(response)).createOrder(
          "access-token",
          createOrderRequest,
          idempotencyKey,
        ),
      ).rejects.toMatchObject({
        code: "API_CONTRACT_ERROR",
        status: 201,
      } satisfies Partial<ApiError>);
    },
  );

  it("отклоняет успешный статус, отличный от 201", async () => {
    await expect(
      createOrdersApi(client(orderResponse, [], 200)).createOrder(
        "access-token",
        createOrderRequest,
        idempotencyKey,
      ),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      status: 200,
    } satisfies Partial<ApiError>);
  });

  it.each(orderErrors)(
    "сохраняет единую ошибку $code со статусом $status",
    async ({ code, details, status }) => {
      await expect(
        createOrdersApi(
          client(
            {
              code,
              details,
              message: "Ошибка заказа.",
              requestId: "request-42",
            },
            [],
            status,
          ),
        ).createOrder("access-token", createOrderRequest, idempotencyKey),
      ).rejects.toMatchObject({
        code,
        details,
        requestId: "request-42",
        status,
      } satisfies Partial<ApiError>);
    },
  );
});

const productId = "00000000-0000-4000-8000-000000000001";
const variantId = "00000000-0000-4000-8000-000000000002";
const modifierOptionId = "00000000-0000-4000-8000-000000000003";
const orderId = "00000000-0000-4000-8000-000000000004";
const idempotencyKey = "00000000-0000-4000-8000-000000000005";

const createOrderRequest = {
  expectedTotalMinor: 43000,
  items: [
    {
      productId,
      variantId,
      modifierOptionIds: [modifierOptionId],
      quantity: 1,
    },
  ],
};

const orderResponse = {
  id: orderId,
  number: "20300102-001",
  stage: "CREATED" as const,
  totalMinor: 43000,
  items: [
    {
      productId,
      variantId,
      productName: "Капучино",
      size: "M" as const,
      quantity: 1,
      unitTotalMinor: 43000,
      lineTotalMinor: 43000,
      modifiers: [
        {
          modifierOptionId,
          modifierName: "Овсяное молоко",
          priceDeltaMinor: 5000,
        },
      ],
    },
  ],
};

const invalidOrderResponses: { name: string; response: unknown }[] = [
  { name: "корневой объект", response: {} },
  { name: "id", response: { ...orderResponse, id: "not-a-uuid" } },
  { name: "number", response: { ...orderResponse, number: 1 } },
  { name: "stage", response: { ...orderResponse, stage: "PREPARING" } },
  { name: "totalMinor", response: { ...orderResponse, totalMinor: 12.5 } },
  { name: "items", response: { ...orderResponse, items: {} } },
  {
    name: "item.productId",
    response: withInvalidItem({ productId: "not-a-uuid" }),
  },
  {
    name: "item.variantId",
    response: withInvalidItem({ variantId: "not-a-uuid" }),
  },
  {
    name: "item.productName",
    response: withInvalidItem({ productName: 1 }),
  },
  { name: "item.size", response: withInvalidItem({ size: "XL" }) },
  { name: "item.quantity", response: withInvalidItem({ quantity: 1.5 }) },
  {
    name: "item.unitTotalMinor",
    response: withInvalidItem({ unitTotalMinor: 1.5 }),
  },
  {
    name: "item.lineTotalMinor",
    response: withInvalidItem({ lineTotalMinor: 1.5 }),
  },
  { name: "item.modifiers", response: withInvalidItem({ modifiers: {} }) },
  {
    name: "modifier.modifierOptionId",
    response: withInvalidModifier({ modifierOptionId: "not-a-uuid" }),
  },
  {
    name: "modifier.modifierName",
    response: withInvalidModifier({ modifierName: 1 }),
  },
  {
    name: "modifier.priceDeltaMinor",
    response: withInvalidModifier({ priceDeltaMinor: 1.5 }),
  },
];

const orderErrors = [
  { code: "ORDER_TOTAL_CHANGED", details: { totalMinor: 43000 }, status: 400 },
  {
    code: "MENU_ITEM_UNAVAILABLE",
    details: { itemId: productId },
    status: 400,
  },
  { code: "ORDER_INTAKE_CLOSED", details: null, status: 400 },
  { code: "VALIDATION_ERROR", details: null, status: 400 },
  { code: "IDEMPOTENCY_KEY_REUSED", details: null, status: 409 },
];

function withInvalidItem(item: Record<string, unknown>): unknown {
  return {
    ...orderResponse,
    items: [{ ...orderResponse.items[0], ...item }],
  };
}

function withInvalidModifier(modifier: Record<string, unknown>): unknown {
  return withInvalidItem({
    modifiers: [{ ...orderResponse.items[0]!.modifiers[0], ...modifier }],
  });
}

function client(
  response: unknown,
  capture: RequestInit[] = [],
  status = 201,
): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v1",
    fetcher: async (_url, options) => {
      capture.push(options ?? {});

      return new Response(JSON.stringify(response), { status });
    },
  });
}
