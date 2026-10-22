import type {
  OperatingSettingsRepository,
  SaveOperatingSettingsCommand,
} from "../application/operating-settings.types";
import type { OperatingSettings } from "../domain/operating-settings.types";
import { readOperatingSettings } from "./operating-settings-row";
import type {
  OperatingSettingsDatabaseRow,
  OperatingSettingsPool,
} from "./postgres-operating-settings.repository.types";
import {
  operatingSettingsAuditId,
  operatingSettingsProjection,
} from "./postgres-operating-settings.repository.constants";

export class PostgresOperatingSettingsRepository implements OperatingSettingsRepository {
  constructor(private readonly getPool: () => OperatingSettingsPool) {}
  async get(): Promise<OperatingSettings> {
    const result = await this.getPool().query<OperatingSettingsDatabaseRow>(
      `SELECT ${operatingSettingsProjection} FROM service_operating_settings WHERE id = 1`,
    );
    return readOperatingSettings(result.rows);
  }
  async save(
    command: SaveOperatingSettingsCommand,
  ): Promise<OperatingSettings> {
    const client = await this.getPool().connect();
    try {
      await client.query("BEGIN");
      const old = await client.query<OperatingSettingsDatabaseRow>(
        `SELECT ${operatingSettingsProjection} FROM service_operating_settings WHERE id = 1 FOR UPDATE`,
      );
      const before = readOperatingSettings(old.rows);
      if (
        before.opensAt === command.settings.opensAt &&
        before.closesAt === command.settings.closesAt &&
        before.slotCapacity === command.settings.slotCapacity
      ) {
        await client.query("COMMIT");
        return before;
      }
      const updated = await client.query<OperatingSettingsDatabaseRow>(
        `UPDATE service_operating_settings SET opens_at = $1::time, closes_at = $2::time, slot_capacity = $3, updated_at = $4, updated_by = $5 WHERE id = 1 RETURNING ${operatingSettingsProjection}`,
        [
          command.settings.opensAt,
          command.settings.closesAt,
          command.settings.slotCapacity,
          command.occurredAt,
          command.actorId,
        ],
      );
      const after = readOperatingSettings(updated.rows);
      await client.query(
        `INSERT INTO audit_events(actor_id, entity_type, entity_id, action, before_state, after_state, request_id, created_at) VALUES ($1, 'service_operating_settings', $2, 'update', $3::jsonb, $4::jsonb, $5, $6)`,
        [
          command.actorId,
          operatingSettingsAuditId,
          JSON.stringify(before),
          JSON.stringify(after),
          command.requestId,
          command.occurredAt,
        ],
      );
      await client.query("COMMIT");
      return after;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
