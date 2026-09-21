import { revalidateOrder } from "./order-revalidation";
import type { OrderCatalog, OrderRequest } from "./order.types";

const catalog: OrderCatalog = {
  acceptsNewOrders: true,
  products: [
    {
      id: "coffee",
      name: "Раф",
      price: null,
      portionLabel: null,
      isAvailable: true,
      priceChoices: [
        { id: "small", portionLabel: "250 мл", price: 270, isAvailable: true },
        { id: "large", portionLabel: "350 мл", price: 310, isAvailable: true },
      ],
      modifierGroups: [],
    },
  ],
};

describe("revalidateOrder", () => {
  it("snapshots a v3 price choice", () => {
    const request: OrderRequest = {
      total: 270,
      items: [
        {
          productId: "coffee",
          priceChoiceId: "small",
          modifierOptionIds: [],
          quantity: 1,
        },
      ],
    };
    expect(revalidateOrder(request, catalog)).toMatchObject({
      total: 270,
      items: [
        { priceChoiceId: "small", portionLabel: "250 мл", unitTotal: 270 },
      ],
    });
  });
});
