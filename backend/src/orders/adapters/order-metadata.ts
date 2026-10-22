import { pickupSlotMilliseconds } from "../domain/order-metadata.constants";
import type { OrderMetadata } from "../domain/order-metadata.types";
import type { DatabaseRow } from "./postgres-order-lifecycle.types";

export function readOrderMetadata(row: DatabaseRow): Required<OrderMetadata> {
  const startsAt = nullableDate(row, "pickup_slot_start");
  const endsAt = nullableDate(row, "pickup_slot_end");
  const at = nullableDate(row, "rejected_at");
  if ((startsAt === null) !== (endsAt === null)) {
    throw new Error("Invalid stored pickup slot");
  }
  if (
    startsAt !== null &&
    endsAt !== null &&
    endsAt.getTime() - startsAt.getTime() !== pickupSlotMilliseconds
  ) {
    throw new Error("Invalid stored pickup duration");
  }
  if (at === null) {
    if (row.rejection_reason !== null || row.rejected_by !== null) {
      throw new Error("Invalid stored rejection");
    }
    return {
      pickupSlot:
        startsAt !== null && endsAt !== null ? { startsAt, endsAt } : null,
      rejection: null,
    };
  }
  if (
    typeof row.rejection_reason !== "string" ||
    row.rejection_reason.trim() === "" ||
    typeof row.rejected_by !== "string"
  ) {
    throw new Error("Invalid stored rejection");
  }
  return {
    pickupSlot:
      startsAt !== null && endsAt !== null ? { startsAt, endsAt } : null,
    rejection: { reason: row.rejection_reason, at, actorId: row.rejected_by },
  };
}

function nullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error("Invalid stored order field: " + key);
  }
  return value;
}
