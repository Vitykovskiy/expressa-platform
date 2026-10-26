import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import {
  AVAILABILITY_ENDPOINT,
  INTAKE_ENDPOINT,
  PRICE_CHOICE_AVAILABILITY_ENDPOINT,
} from "./availability.constants";
import {
  confirmsAvailabilityChange,
  parseAvailability,
} from "./availability.dto";
import { mapAvailability } from "./availability.mapper";
import type {
  AvailabilityChangeOutcome,
  AvailabilityItem,
  AvailabilityReadOutcome,
  AvailabilityTarget,
} from "./availability.types";

export async function readAvailability(
  accessToken: string,
  signal: AbortSignal,
): Promise<AvailabilityReadOutcome> {
  const result = await requestApi(AVAILABILITY_ENDPOINT, {
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

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "failed" };
  }

  const dto = parseAvailability(result.body);

  if (dto === null) {
    return { kind: "failed" };
  }

  return { kind: "loaded", groups: mapAvailability(dto) };
}

export async function changeAvailability(
  accessToken: string,
  item: AvailabilityItem,
  signal: AbortSignal,
): Promise<AvailabilityChangeOutcome> {
  const endpoint = availabilityChangeEndpoint(item);
  const result = await requestApi(endpoint, {
    method: "PATCH",
    accessToken,
    signal,
    body:
      item.type === "intake"
        ? { acceptsNewOrders: !item.persistedAvailable }
        : { isAvailable: !item.persistedAvailable },
  });

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  // Отмена ожидания записи не доказывает, что сервер её не применил.
  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  if (
    result.status === 200 &&
    confirmsAvailabilityChange(result.body, item, !item.persistedAvailable)
  ) {
    return { kind: "confirmed" };
  }

  const error = parseApiHttpError(result.body);

  if (result.status === 404 && error?.code === "AVAILABILITY_ITEM_NOT_FOUND") {
    return { kind: "rejected" };
  }

  return { kind: "unknown" };
}

function availabilityChangeEndpoint(target: AvailabilityTarget): string {
  switch (target.type) {
    case "intake":
      return INTAKE_ENDPOINT;
    case "price-choice":
      return `${PRICE_CHOICE_AVAILABILITY_ENDPOINT}/${encodeURIComponent(target.id)}`;
    default:
      return `${AVAILABILITY_ENDPOINT}/${target.type}/${encodeURIComponent(target.id)}`;
  }
}
