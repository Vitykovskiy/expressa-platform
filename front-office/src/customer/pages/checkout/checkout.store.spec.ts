import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, createApiClient } from "../../../shared/api/client";
import type { Order, OrdersApi } from "../../../shared/api/orders.api";
import {
  checkoutErrorCodes,
  checkoutStatuses,
} from "./checkout.store.constants";
import {
  configureCheckoutStoreDependencies,
  getCheckoutStoreDependencies,
  setCheckoutStoreDependencies,
} from "./checkout.store.dependencies";
import { useCheckoutStore } from "./checkout.store";
import type {
  CheckoutStoreDependencies,
  CheckoutSubmission,
} from "./checkout.store.types";

describe("CheckoutStore", () => {
  let ordersApi: OrdersApi;
  let createIdempotencyKey: ReturnType<typeof vi.fn<() => string>>;

  beforeEach(() => {
    setActivePinia(createPinia());
    ordersApi = { createOrder: vi.fn() };
    createIdempotencyKey = vi
      .fn<() => string>()
      .mockReturnValueOnce("key-1")
      .mockReturnValueOnce("key-2")
      .mockReturnValue("key-3");
    setCheckoutStoreDependencies({
      createIdempotencyKey,
      ordersApi,
    } satisfies CheckoutStoreDependencies);
  });

  it("строит запрос только из сохранённой серверной конфигурации", async () => {
    vi.mocked(ordersApi.createOrder).mockResolvedValue(order);
    const store = useCheckoutStore();

    await store.confirm(submission);

    expect(ordersApi.createOrder).toHaveBeenCalledWith(
      "access-token",
      {
        expectedTotalMinor: 41000,
        items: [
          {
            modifierOptionIds: [modifierId],
            productId,
            quantity: 1,
            variantId,
          },
        ],
      },
      "key-1",
    );
    expect(store.status).toBe(checkoutStatuses.succeeded);
    expect(store.order).toEqual(order);
    expect(store.attempt).toBeNull();
  });

  it("создаёт UUID через настроенную browser-зависимость", () => {
    configureCheckoutStoreDependencies(createApiClient("/"));

    expect(getCheckoutStoreDependencies().createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("не отправляет legacy-корзину", async () => {
    const store = useCheckoutStore();

    await store.confirm({
      ...submission,
      cartItems: [
        {
          addons: [],
          id: "legacy-cart-item",
          lineTotalRub: 410,
          productId,
          productName: "Кофе",
          quantity: 1,
          type: "drink",
        },
      ],
    });

    expect(ordersApi.createOrder).not.toHaveBeenCalled();
    expect(store.errorCode).toBe(checkoutErrorCodes.invalidCart);
    expect(store.status).toBe(checkoutStatuses.error);
  });

  it("блокирует дублирующую отправку", async () => {
    let resolveOrder: (value: Order) => void = () => undefined;
    vi.mocked(ordersApi.createOrder).mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      }),
    );
    const store = useCheckoutStore();

    const first = store.confirm(submission);
    const duplicate = store.confirm(submission);
    resolveOrder(order);

    await expect(Promise.all([first, duplicate])).resolves.toEqual([
      order,
      order,
    ]);
    expect(ordersApi.createOrder).toHaveBeenCalledTimes(1);
    expect(createIdempotencyKey).toHaveBeenCalledTimes(1);
  });

  it("повторяет сетевую ошибку тем же запросом и ключом", async () => {
    vi.mocked(ordersApi.createOrder)
      .mockRejectedValueOnce(apiError("NETWORK_ERROR"))
      .mockResolvedValueOnce(order);
    const store = useCheckoutStore();

    await store.confirm(submission);
    await store.retry("access-token");

    expect(ordersApi.createOrder).toHaveBeenNthCalledWith(
      1,
      "access-token",
      expect.any(Object),
      "key-1",
    );
    expect(ordersApi.createOrder).toHaveBeenNthCalledWith(
      2,
      "access-token",
      expect.any(Object),
      "key-1",
    );
    expect(store.status).toBe(checkoutStatuses.succeeded);
    expect(createIdempotencyKey).toHaveBeenCalledTimes(1);
  });

  it("после успеха создаёт новый ключ для следующего заказа", async () => {
    vi.mocked(ordersApi.createOrder).mockResolvedValue(order);
    const store = useCheckoutStore();

    await store.confirm(submission);
    await store.confirm(submission);

    expect(ordersApi.createOrder).toHaveBeenNthCalledWith(
      1,
      "access-token",
      expect.any(Object),
      "key-1",
    );
    expect(ordersApi.createOrder).toHaveBeenNthCalledWith(
      2,
      "access-token",
      expect.any(Object),
      "key-2",
    );
  });

  it("требует отдельного переподтверждения нового итога с новым ключом", async () => {
    vi.mocked(ordersApi.createOrder)
      .mockRejectedValueOnce(
        apiError("ORDER_TOTAL_CHANGED", { totalMinor: 45000 }),
      )
      .mockResolvedValueOnce(order);
    const store = useCheckoutStore();

    await store.confirm(submission);
    await store.confirm(submission);

    expect(store.status).toBe(checkoutStatuses.reconfirmationRequired);
    expect(store.reconfirmedTotalMinor).toBe(45000);
    expect(ordersApi.createOrder).toHaveBeenCalledTimes(1);

    await store.reconfirm(submission);

    expect(ordersApi.createOrder).toHaveBeenNthCalledWith(
      2,
      "access-token",
      expect.objectContaining({ expectedTotalMinor: 45000 }),
      "key-2",
    );
  });

  it("помечает позицию только по адресуемому product ID", async () => {
    vi.mocked(ordersApi.createOrder).mockRejectedValue(
      apiError("MENU_ITEM_UNAVAILABLE", { itemId: productId }),
    );
    const store = useCheckoutStore();

    await store.confirm(submission);

    expect(store.errorCode).toBe(checkoutErrorCodes.itemUnavailable);
    expect(store.unavailableCartItemIds).toEqual(["cart-item"]);
  });

  it.each([
    ["variant ID", variantId],
    ["modifier option ID", modifierId],
  ])("помечает позицию по адресуемому %s", async (_name, itemId) => {
    vi.mocked(ordersApi.createOrder).mockRejectedValue(
      apiError("MENU_ITEM_UNAVAILABLE", { itemId }),
    );
    const store = useCheckoutStore();

    await store.confirm(submission);

    expect(store.unavailableCartItemIds).toEqual(["cart-item"]);
  });

  it("не выдумывает затронутые позиции без адресуемого ID", async () => {
    vi.mocked(ordersApi.createOrder).mockRejectedValue(
      apiError("MENU_ITEM_UNAVAILABLE", {}),
    );
    const store = useCheckoutStore();

    await store.confirm(submission);

    expect(store.errorCode).toBe(checkoutErrorCodes.itemUnavailable);
    expect(store.unavailableCartItemIds).toEqual([]);
  });

  it.each([
    [
      "закрытый приём",
      apiError("ORDER_INTAKE_CLOSED"),
      checkoutErrorCodes.intakeClosed,
    ],
    ["общую ошибку", apiError("VALIDATION_ERROR"), checkoutErrorCodes.unknown],
  ])("сохраняет %s", async (_name, error, code) => {
    vi.mocked(ordersApi.createOrder).mockRejectedValue(error);
    const store = useCheckoutStore();

    await store.confirm(submission);

    expect(store.errorCode).toBe(code);
    expect(store.status).toBe(checkoutStatuses.error);
  });
});

const productId = "00000000-0000-4000-8000-000000000001";
const variantId = "00000000-0000-4000-8000-000000000002";
const modifierId = "00000000-0000-4000-8000-000000000003";

const submission: CheckoutSubmission = {
  accessToken: "access-token",
  cartItems: [
    {
      addons: [],
      id: "cart-item",
      lineTotalMinor: 41000,
      lineTotalRub: 410,
      productId,
      productName: "Кофе",
      quantity: 1,
      selectedModifierOptions: [
        {
          groupId: "milk",
          id: modifierId,
          name: "Овсяное",
          priceDeltaMinor: 1000,
        },
      ],
      selectedVariant: { id: variantId, priceMinor: 40000, size: "M" },
      size: "M",
      sizePrice: 400,
      type: "DRINK",
      unitTotalMinor: 41000,
    },
  ],
};

const order: Order = {
  id: "00000000-0000-4000-8000-000000000004",
  items: [],
  number: "20300102-001",
  stage: "CREATED",
  totalMinor: 41000,
};

function apiError(code: string, details: unknown = null): ApiError {
  return new ApiError({
    code,
    details,
    message: "Ошибка заказа.",
    requestId: "request-id",
    status: 400,
  });
}
