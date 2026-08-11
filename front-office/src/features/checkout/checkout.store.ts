import { defineStore } from "pinia";

import { ApiError } from "@/shared/api/client";
import {
  checkoutErrorCodes,
  checkoutMessages,
  checkoutStatuses,
  checkoutStoreId,
  initialCheckoutState,
} from "./checkout.store.constants";
import { getCheckoutStoreDependencies } from "./checkout.store.dependencies";
import type {
  CheckoutErrorCode,
  CheckoutRequest,
  CheckoutSubmission,
} from "./checkout.store.types";

export const useCheckoutStore = defineStore(checkoutStoreId, {
  state: () => ({ ...initialCheckoutState }),
  actions: {
    confirm(submission: CheckoutSubmission): Promise<unknown> {
      if (this.submitPromise !== null) return this.submitPromise;
      if (this.status === checkoutStatuses.reconfirmationRequired) {
        return Promise.resolve(null);
      }

      const request = createCheckoutRequest(submission.cartItems);
      if (request === null) {
        this.setError(
          checkoutErrorCodes.invalidCart,
          checkoutMessages.invalidCart,
        );
        return Promise.resolve(null);
      }

      this.attempt = createAttempt(request, submission.cartItems);
      return this.send(submission.accessToken);
    },
    reconfirm(submission: CheckoutSubmission): Promise<unknown> {
      if (this.submitPromise !== null) return this.submitPromise;
      if (this.status !== checkoutStatuses.reconfirmationRequired) {
        return Promise.resolve(null);
      }

      const request = createCheckoutRequest(
        submission.cartItems,
        this.reconfirmedTotalMinor,
      );
      if (request === null) {
        this.setError(
          checkoutErrorCodes.invalidCart,
          checkoutMessages.invalidCart,
        );
        return Promise.resolve(null);
      }

      this.attempt = createAttempt(request, submission.cartItems);
      this.reconfirmedTotalMinor = null;
      return this.send(submission.accessToken);
    },
    retry(accessToken: string): Promise<unknown> {
      if (this.submitPromise !== null) return this.submitPromise;
      if (
        this.attempt === null ||
        this.errorCode !== checkoutErrorCodes.network
      ) {
        return Promise.resolve(null);
      }

      return this.send(accessToken);
    },
    reset(): void {
      Object.assign(this, initialCheckoutState);
    },
    setError(code: CheckoutErrorCode, message: string): void {
      this.errorCode = code;
      this.errorMessage = message;
      this.order = null;
      this.status = checkoutStatuses.error;
      this.unavailableCartItemIds = [];
    },
    send(accessToken: string): Promise<unknown> {
      const attempt = this.attempt;
      if (attempt === null) return Promise.resolve(null);

      this.status = checkoutStatuses.submitting;
      this.errorCode = null;
      this.errorMessage = null;
      this.unavailableCartItemIds = [];

      const submitPromise = getCheckoutStoreDependencies()
        .ordersApi.createOrder(
          accessToken,
          attempt.request,
          attempt.idempotencyKey,
        )
        .then((order) => {
          this.order = order;
          this.status = checkoutStatuses.succeeded;
          this.attempt = null;
          return order;
        })
        .catch((error: unknown) => {
          this.handleError(error, attempt);
          return null;
        })
        .finally(() => {
          this.submitPromise = null;
        });

      this.submitPromise = submitPromise;
      return submitPromise;
    },
    handleError(
      error: unknown,
      attempt: {
        cartItemIdsByAddressableId: Record<string, string[]>;
        request: CheckoutRequest;
      },
    ): void {
      if (!(error instanceof ApiError)) {
        this.setError(checkoutErrorCodes.unknown, checkoutMessages.orderFailed);
        this.attempt = null;
        return;
      }

      if (error.code === checkoutErrorCodes.network) {
        this.setError(checkoutErrorCodes.network, checkoutMessages.retryFailed);
        return;
      }

      this.attempt = null;

      if (error.code === checkoutErrorCodes.totalChanged) {
        const totalMinor = getTotalMinor(error.details);
        if (totalMinor !== null) {
          this.errorCode = checkoutErrorCodes.totalChanged;
          this.errorMessage = checkoutMessages.totalChanged;
          this.order = null;
          this.reconfirmedTotalMinor = totalMinor;
          this.status = checkoutStatuses.reconfirmationRequired;
          this.unavailableCartItemIds = [];
          return;
        }
      }

      if (error.code === checkoutErrorCodes.itemUnavailable) {
        this.setError(
          checkoutErrorCodes.itemUnavailable,
          checkoutMessages.itemUnavailable,
        );
        this.unavailableCartItemIds = getUnavailableCartItemIds(
          error.details,
          attempt.cartItemIdsByAddressableId,
        );
        return;
      }

      if (error.code === checkoutErrorCodes.intakeClosed) {
        this.setError(
          checkoutErrorCodes.intakeClosed,
          checkoutMessages.intakeClosed,
        );
        return;
      }

      this.setError(checkoutErrorCodes.unknown, checkoutMessages.orderFailed);
    },
  },
});

function createCheckoutRequest(
  cartItems: CheckoutSubmission["cartItems"],
  expectedTotalMinor?: number | null,
): CheckoutRequest | null {
  const items: CheckoutRequest["items"] = [];

  for (const cartItem of cartItems) {
    const item = toCheckoutRequestItem(cartItem);
    if (item === null) return null;
    items.push(item);
  }

  const totalMinor = expectedTotalMinor ?? getCartTotalMinor(cartItems);
  if (!isNonNegativeInteger(totalMinor) || items.length === 0) return null;

  return { expectedTotalMinor: totalMinor, items };
}

function createAttempt(
  request: CheckoutRequest,
  cartItems: CheckoutSubmission["cartItems"],
) {
  return {
    cartItemIdsByAddressableId: cartItems.reduce<Record<string, string[]>>(
      (result, item) => {
        for (const id of getAddressableIds(item)) {
          const cartItemIds = result[id] ?? [];
          cartItemIds.push(item.id);
          result[id] = cartItemIds;
        }
        return result;
      },
      {},
    ),
    idempotencyKey: getCheckoutStoreDependencies().createIdempotencyKey(),
    request,
  };
}

function getAddressableIds(
  item: CheckoutSubmission["cartItems"][number],
): string[] {
  if (!isPersistedCartItem(item)) return [];

  return [
    item.productId,
    ...(item.type === "DRINK" ? [item.selectedVariant.id] : []),
    ...item.selectedModifierOptions.map((option) => option.id),
  ];
}

function toCheckoutRequestItem(
  cartItem: CheckoutSubmission["cartItems"][number],
): CheckoutRequest["items"][number] | null {
  if (!isPersistedCartItem(cartItem)) return null;

  return {
    modifierOptionIds: cartItem.selectedModifierOptions.map(
      (option) => option.id,
    ),
    productId: cartItem.productId,
    quantity: cartItem.quantity,
    variantId: cartItem.type === "DRINK" ? cartItem.selectedVariant.id : null,
  };
}

function isPersistedCartItem(
  value: CheckoutSubmission["cartItems"][number],
): value is Extract<
  CheckoutSubmission["cartItems"][number],
  { type: "DRINK" | "OTHER" }
> {
  if (value.type !== "DRINK" && value.type !== "OTHER") return false;
  if (
    !isNonEmptyString(value.productId) ||
    !isPositiveInteger(value.quantity) ||
    !isNonNegativeInteger(value.unitTotalMinor) ||
    value.lineTotalMinor !== value.unitTotalMinor * value.quantity
  ) {
    return false;
  }

  if (
    !value.selectedModifierOptions.every((option) =>
      isNonEmptyString(option.id),
    )
  ) {
    return false;
  }

  return value.type !== "DRINK" || isNonEmptyString(value.selectedVariant.id);
}

function getCartTotalMinor(
  cartItems: CheckoutSubmission["cartItems"],
): number | null {
  const totalMinor = cartItems.reduce((total, item) => {
    return total + ("lineTotalMinor" in item ? item.lineTotalMinor : NaN);
  }, 0);

  return isNonNegativeInteger(totalMinor) ? totalMinor : null;
}

function getTotalMinor(details: unknown): number | null {
  if (!isRecord(details) || !isNonNegativeInteger(details.totalMinor))
    return null;
  return details.totalMinor;
}

function getUnavailableCartItemIds(
  details: unknown,
  cartItemIdsByAddressableId: Record<string, string[]>,
): string[] {
  if (!isRecord(details) || !isNonEmptyString(details.itemId)) return [];
  return cartItemIdsByAddressableId[details.itemId] ?? [];
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
