import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import {
  ORDER_ACTION_PATHS,
  ORDER_ACTION_STAGES,
  ORDERS_ENDPOINT,
} from "./orders.constants";
import { parseLegacyOrder, parseOrder } from "./orders.dto";
import type {
  OrderDto,
  OrderRecord,
  OrderReadOutcome,
  OrdersReadOutcome,
  OrdersQuery,
  OrderAction,
  OrderCommandOutcome,
} from "./orders.types";

export async function readOrders(
  accessToken: string,
  query: OrdersQuery,
  signal: AbortSignal,
): Promise<OrdersReadOutcome> {
  const params = new URLSearchParams();

  if (query.number !== null) {
    params.set("number", query.number);
  }

  if (query.stage !== null) {
    params.set("stage", query.stage);
  } else {
    params.set("view", query.view);
  }

  const result = await requestApi(`${ORDERS_ENDPOINT}?${params}`, {
    method: "GET",
    accessToken,
    signal,
  });

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (
    result.kind !== "http" ||
    result.status !== 200 ||
    !Array.isArray(result.body)
  ) {
    return { kind: "failed" };
  }

  const orders: OrderDto[] = [];

  for (const value of result.body) {
    const order = parseOrder(value);

    if (order === null || orders.some((known) => known.id === order.id)) {
      return { kind: "failed" };
    }

    orders.push(order);
  }

  return { kind: "loaded", orders };
}

export async function readOrder(
  accessToken: string,
  id: string,
  signal: AbortSignal,
): Promise<OrderReadOutcome> {
  const result = await requestApi(
    `${ORDERS_ENDPOINT}/${encodeURIComponent(id)}`,
    { method: "GET", accessToken, signal },
  );

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (result.kind !== "http") {
    return { kind: "failed" };
  }

  if (
    result.status === 404 &&
    parseApiHttpError(result.body)?.code === "ORDER_NOT_FOUND"
  ) {
    return { kind: "not-found" };
  }

  const order = result.status === 200 ? parseOrder(result.body) : null;

  return order === null || order.id !== id
    ? { kind: "failed" }
    : { kind: "loaded", order };
}

export async function sendOrderCommand(
  accessToken: string,
  order: OrderRecord,
  action: OrderAction,
  reason: string,
  signal: AbortSignal,
): Promise<OrderCommandOutcome> {
  const result = await requestApi(
    `${ORDER_ACTION_PATHS[action]}/${encodeURIComponent(order.id)}/${action}`,
    {
      method: "POST",
      accessToken,
      signal,
      body: commandBody(action, reason),
    },
  );

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  const error = parseApiHttpError(result.body);

  if (result.status === 409 && error?.code === "ORDER_STAGE_CONFLICT") {
    return { kind: "conflict" };
  }

  if (result.status === 404 && error?.code === "ORDER_NOT_FOUND") {
    return { kind: "not-found" };
  }

  if (result.status === 400 && error?.code === "VALIDATION_ERROR") {
    return { kind: "rejected" };
  }

  if (result.status !== 200) {
    return { kind: "unknown" };
  }

  let updated: OrderDto | null;

  if (action === "accept" || action === "issue") {
    const core = parseLegacyOrder(result.body);

    updated =
      core === null || core.customer.id !== order.customerId
        ? null
        : {
            ...core,
            customer: { ...core.customer, name: order.customerName },
            pickupSlot: order.pickupSlot,
            rejection: order.rejection,
          };
  } else {
    updated = parseOrder(result.body);
  }

  if (
    updated === null ||
    updated.id !== order.id ||
    updated.stage !== ORDER_ACTION_STAGES[action] ||
    (action === "reject"
      ? updated.rejection?.reason !== reason
      : updated.rejection !== null)
  ) {
    return { kind: "unknown" };
  }

  return { kind: "confirmed", order: updated };
}

function commandBody(action: OrderAction, reason: string): unknown {
  if (action === "reject") {
    return { reason };
  }

  if (action === "ready") {
    return {};
  }

  return undefined;
}
