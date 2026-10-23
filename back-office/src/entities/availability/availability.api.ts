import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import {
  AVAILABILITY_ENDPOINT,
  INTAKE_ENDPOINT,
  PRICE_CHOICE_AVAILABILITY_ENDPOINT,
} from "./availability.constants";
import { parseAvailability, parseIntake } from "./availability.dto";
import { mapAvailability } from "./availability.mapper";
import type {
  AvailabilityChangeOutcome,
  AvailabilityItem,
  AvailabilityReadOutcome,
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

  return dto === null
    ? { kind: "failed" }
    : { kind: "loaded", groups: mapAvailability(dto) };
}

export async function changeAvailability(
  accessToken: string,
  item: AvailabilityItem,
  signal: AbortSignal,
): Promise<AvailabilityChangeOutcome> {
  const endpoint =
    item.type === "intake"
      ? INTAKE_ENDPOINT
      : item.type === "price-choice"
        ? `${PRICE_CHOICE_AVAILABILITY_ENDPOINT}/${encodeURIComponent(item.id)}`
        : `${AVAILABILITY_ENDPOINT}/${item.type}/${encodeURIComponent(item.id)}`;
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

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  const body = result.body;

  if (item.type === "intake" && result.status === 200) {
    const intake = parseIntake(body);

    if (
      intake !== null &&
      intake.acceptsNewOrders === !item.persistedAvailable
    ) {
      return { kind: "confirmed" };
    }
  }

  if (
    result.status === 200 &&
    typeof body === "object" &&
    body !== null &&
    "type" in body &&
    body.type === (item.type === "price-choice" ? "price_choice" : item.type) &&
    "id" in body &&
    body.id === item.id &&
    "isAvailable" in body &&
    body.isAvailable === !item.persistedAvailable
  ) {
    return { kind: "confirmed" };
  }

  const error = parseApiHttpError(body);

  if (result.status === 404 && error?.code === "AVAILABILITY_ITEM_NOT_FOUND") {
    return { kind: "rejected" };
  }

  return { kind: "unknown" };
}
