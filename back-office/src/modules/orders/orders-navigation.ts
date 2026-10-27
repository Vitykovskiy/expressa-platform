import type { LocationQuery, RouteLocationRaw } from "vue-router";
import { ORDER_STAGES, ORDER_UUID } from "./orders.constants";
import type { OrdersIntent, OrderNavigationRequest } from "./orders.types";
import {
  ORDER_NAVIGATION_QUERY_KEYS,
  ORDER_NUMBER_MAX_LENGTH,
} from "./orders-navigation.constants";

export function readOrdersIntent(query: LocationQuery): OrdersIntent {
  if (
    ORDER_NAVIGATION_QUERY_KEYS.some(
      (key) => query[key] === null || Array.isArray(query[key]),
    )
  ) {
    return { kind: "invalid" };
  }

  const number = query.number;
  const stageValue = query.stage;
  const orderId = query.order;

  if (
    number !== undefined &&
    (typeof number !== "string" ||
      number.trim().length === 0 ||
      number.length > ORDER_NUMBER_MAX_LENGTH)
  ) {
    return { kind: "invalid" };
  }

  const stage =
    stageValue === undefined
      ? null
      : ORDER_STAGES.find((value) => value === stageValue);

  if (
    stage === undefined ||
    (orderId !== undefined &&
      (typeof orderId !== "string" || !ORDER_UUID.test(orderId)))
  ) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    number: number ?? null,
    stage,
    orderId: orderId === undefined ? null : orderId.toLowerCase(),
  };
}

export function ordersLocation(
  query: LocationQuery,
  hash: string,
  request: OrderNavigationRequest,
): RouteLocationRaw {
  const nextQuery = { ...query };

  delete nextQuery.section;

  for (const [key, value] of [
    ["number", request.number],
    ["stage", request.stage],
    ["order", request.orderId],
  ] as const) {
    if (value === null) {
      delete nextQuery[key];
    } else {
      nextQuery[key] = value;
    }
  }

  return { name: "orders", query: nextQuery, hash };
}
