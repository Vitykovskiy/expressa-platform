import type { ApiClient } from "./client";
import {
  canonicalUtcPattern,
  pickupSlotDurationMs,
  pickupSlotsPath,
} from "./pickup-slots.api.constants";
import type {
  PickupAvailability,
  PickupSlotsResponse,
} from "./pickup-slots.api.types";

export function createPickupSlotsApi(client: ApiClient) {
  return {
    async load(accessToken: string): Promise<PickupAvailability> {
      const response = await client.request(
        pickupSlotsPath,
        isPickupSlotsResponse,
        {
          method: "GET",
          expectedStatus: 200,
          headers: { authorization: `Bearer ${accessToken}` },
        },
      );

      return {
        serviceDay: response.serviceDay,
        acceptsNewOrders: response.acceptsNewOrders,
        choices: response.slots.map((slot) => ({
          startsAt: slot.startsAt,
          label: `${slot.startsAt.slice(11, 16)}–${slot.endsAt.slice(11, 16)}`,
          available: slot.available,
        })),
      };
    },
  };
}

function isPickupSlotsResponse(value: unknown): value is PickupSlotsResponse {
  if (
    !isRecord(value) ||
    typeof value.serviceDay !== "string" ||
    !isCanonicalTimestamp(`${value.serviceDay}T00:00:00.000Z`) ||
    value.timeZone !== "UTC" ||
    value.slotMinutes !== 10 ||
    typeof value.acceptsNewOrders !== "boolean" ||
    !Array.isArray(value.slots)
  ) {
    return false;
  }

  let previousStart = "";

  for (const slot of value.slots) {
    if (
      !isRecord(slot) ||
      !isCanonicalTimestamp(slot.startsAt) ||
      !isCanonicalTimestamp(slot.endsAt) ||
      typeof slot.available !== "boolean" ||
      slot.startsAt.slice(0, 10) !== value.serviceDay ||
      slot.endsAt.slice(0, 10) !== value.serviceDay ||
      Date.parse(slot.endsAt) - Date.parse(slot.startsAt) !==
        pickupSlotDurationMs ||
      slot.startsAt <= previousStart
    ) {
      return false;
    }

    previousStart = slot.startsAt;
  }

  return true;
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !canonicalUtcPattern.test(value)) {
    return false;
  }

  const timestamp = Date.parse(value);

  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
