import {
  ORDER_STAGES,
  ORDER_UUID,
} from "../../entities/orders/orders.constants";
import type {
  OrdersIntent,
  OrderNavigationRequest,
} from "../../entities/orders/orders.types";
import {
  ORDER_NAVIGATION_QUERY_KEYS,
  ORDER_NUMBER_MAX_LENGTH,
} from "./orders-navigation.constants";

export function readOrdersIntent(search: string): OrdersIntent {
  const params = new URLSearchParams(search);

  if (
    ORDER_NAVIGATION_QUERY_KEYS.some((key) => params.getAll(key).length > 1)
  ) {
    return { kind: "invalid" };
  }

  const number = params.get("number");

  if (number !== null) {
    if (number.trim().length === 0 || number.length > ORDER_NUMBER_MAX_LENGTH) {
      return { kind: "invalid" };
    }
  }

  const stageValue = params.get("stage");
  const stage =
    stageValue === null
      ? null
      : ORDER_STAGES.find((value) => value === stageValue);

  if (stage === undefined) {
    return { kind: "invalid" };
  }

  const orderId = params.get("order");

  if (orderId !== null && !ORDER_UUID.test(orderId)) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    number,
    stage,
    orderId: orderId === null ? null : orderId.toLowerCase(),
  };
}

export function ordersNavigationHref(
  href: string,
  request: OrderNavigationRequest,
): string {
  const url = new URL(href);

  for (const [key, value] of [
    ["number", request.number],
    ["stage", request.stage],
    ["order", request.orderId],
  ] as const) {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
