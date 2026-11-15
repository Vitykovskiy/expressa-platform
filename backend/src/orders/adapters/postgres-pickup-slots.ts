import { readOperatingSettings } from "../../service-settings/adapters/operating-settings-row";
import { operatingSettingsProjection } from "../../service-settings/adapters/postgres-operating-settings.repository.constants";
import { acceptsNewOrdersSettingKey } from "../../catalog/domain/catalog.constants";
import type { CustomerPickupSlots } from "../application/pickup-slots.types";
import { pickupSlotMilliseconds } from "../domain/order-metadata.constants";
import type {
  DatabaseRow,
  TransactionClient,
} from "./postgres-order-unit-of-work.types";

/** Вызывающий владеет транзакцией; при бронировании настройки блокируются перед чтением текущего времени. */
export async function readPickupCandidates(
  client: TransactionClient,
  options: { lockSettings: boolean },
): Promise<CustomerPickupSlots> {
  const settings = await client.query<DatabaseRow>(
    `SELECT ${operatingSettingsProjection} FROM service_operating_settings WHERE id = 1${options.lockSettings ? " FOR UPDATE" : ""}`,
  );
  const operating = readOperatingSettings(settings.rows);
  const clock = await client.query<DatabaseRow>(
    "SELECT clock_timestamp() AS now",
  );
  const now = clock.rows[0]?.now;

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error("Invalid PostgreSQL pickup clock");
  }

  const serviceDay = now.toISOString().slice(0, 10);
  const opensAt = new Date(serviceDay + "T" + operating.opensAt + ":00Z");
  const closesAt = new Date(serviceDay + "T" + operating.closesAt + ":00Z");
  const earliest = new Date(
    Math.max(
      opensAt.getTime(),
      Math.ceil(now.getTime() / pickupSlotMilliseconds) *
        pickupSlotMilliseconds,
    ),
  );
  const intake = await client.query<DatabaseRow>(
    "SELECT value FROM service_settings WHERE key = $1",
    [acceptsNewOrdersSettingKey],
  );

  if (intake.rows.length !== 1 || typeof intake.rows[0]?.value !== "boolean") {
    throw new Error("Invalid PostgreSQL intake setting");
  }

  const candidates = await client.query<DatabaseRow>(
    `SELECT candidate AS starts_at,
       (SELECT count(*) FROM orders WHERE rejected_at IS NULL AND stage <> 'ISSUED' AND pickup_slot_start = candidate) < $3 AS available
     FROM generate_series($1::timestamptz, $2::timestamptz - interval '10 minutes', interval '10 minutes') AS candidate
     ORDER BY candidate`,
    [earliest, closesAt, operating.slotCapacity],
  );

  return {
    serviceDay,
    timeZone: "UTC",
    slotMinutes: 10,
    acceptsNewOrders: intake.rows[0].value,
    slots: candidates.rows.map((row) => {
      const startsAt = row.starts_at;

      if (
        !(startsAt instanceof Date) ||
        Number.isNaN(startsAt.getTime()) ||
        typeof row.available !== "boolean"
      ) {
        throw new Error("Invalid PostgreSQL pickup candidate");
      }

      return {
        startsAt,
        endsAt: new Date(startsAt.getTime() + pickupSlotMilliseconds),
        available: row.available,
      };
    }),
  };
}
