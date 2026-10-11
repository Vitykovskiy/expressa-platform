import { contractFailure, request } from "../../shared/api/transport";
import { mapOrder } from "./order.mapper";
import { parseOrder } from "./order.validation";
import {
  commandTotalMaximum,
  orderTransitions,
  uuidPattern,
} from "./order.constants";
import type { Order, OrderFilters, OrderTransition } from "./order.types";

export async function listOrders(
  token: string,
  filters: OrderFilters,
  signal: AbortSignal,
): Promise<Order[]> {
  const query = new URLSearchParams();

  if (filters.number !== null) {
    query.set("number", filters.number);
  }

  if (filters.stage !== null) {
    query.set("stage", filters.stage);
  }

  const data = await request(`/api/v3/backoffice/orders?${query}`, {
    token,
    signal,
    expectedStatus: 200,
  });

  if (!Array.isArray(data)) {
    return contractFailure();
  }

  return data.map((item: unknown) => mapOrder(parseOrder(item)));
}

export async function readOrder(
  token: string,
  id: string,
  signal: AbortSignal,
): Promise<Order> {
  const data = await request(
    `/api/v3/backoffice/orders/${encodeURIComponent(id)}`,
    { token, signal, expectedStatus: 200 },
  );
  const order = mapOrder(parseOrder(data));

  if (order.id !== id) {
    return contractFailure();
  }

  return order;
}

export async function transitionOrder(
  token: string,
  context: OrderTransition,
  actorId: string,
): Promise<Order> {
  const transition = orderTransitions[context.action];

  if (!uuidPattern.test(context.id) || context.from !== transition.from) {
    return contractFailure();
  }

  const data = await request(
    `/api/v2/backoffice/orders/${encodeURIComponent(context.id)}/${transition.path}`,
    { token, method: "POST", expectedStatus: 200 },
  );
  // Current command and read share nested schemas; command context stays distinct.
  const dto = parseOrder(data);

  if (
    dto.id !== context.id ||
    dto.stage !== transition.to ||
    !Number.isInteger(dto.total) ||
    dto.total < 0 ||
    dto.total > commandTotalMaximum ||
    !dto.events.some(
      (event) =>
        event.actorId === actorId &&
        event.from === transition.from &&
        event.to === transition.to,
    )
  ) {
    return contractFailure();
  }

  return mapOrder(dto);
}
