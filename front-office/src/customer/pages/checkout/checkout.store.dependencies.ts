import { createOrdersApi } from "../../../shared/api/orders.api";
import type { ApiClient } from "../../../shared/api/client";
import { checkoutMessages } from "./checkout.store.constants";
import type { CheckoutStoreDependencies } from "./checkout.store.types";

let dependencies: CheckoutStoreDependencies | undefined;

export function configureCheckoutStoreDependencies(apiClient: ApiClient): void {
  dependencies = {
    createIdempotencyKey: () => crypto.randomUUID(),
    ordersApi: createOrdersApi(apiClient),
  };
}

export function getCheckoutStoreDependencies(): CheckoutStoreDependencies {
  if (dependencies === undefined) {
    throw new Error(checkoutMessages.dependenciesNotConfigured);
  }

  return dependencies;
}

export function setCheckoutStoreDependencies(
  nextDependencies: CheckoutStoreDependencies,
): void {
  dependencies = nextDependencies;
}
