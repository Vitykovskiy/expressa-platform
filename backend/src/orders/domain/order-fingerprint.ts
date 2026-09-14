import type { OrderRequest } from "./order.types";

export function createOrderFingerprint(request: OrderRequest): string {
  return JSON.stringify({
    total: request.total,
    pricingMode: request.pricingMode ?? "v2",
    items: request.items
      .map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        priceChoiceId: item.priceChoiceId ?? null,
        modifierOptionIds: item.modifierOptionIds.toSorted(compareCodeUnits),
        quantity: item.quantity,
      }))
      .toSorted((left, right) =>
        compareCodeUnits(JSON.stringify(left), JSON.stringify(right)),
      ),
  });
}

function compareCodeUnits(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}
