import type { PoolClient } from "pg";
import type {
  ModifierAuditEvent,
  ModifiersRepository,
  ModifiersUnitOfWork,
} from "../application/modifiers.repository.types";
import type {
  AdminModifierGroup,
  AdminModifierOption,
  ModifierGroupDetails,
  ModifierOptionDetails,
  ModifierOptionInput,
} from "../domain/modifier-admin.policy.types";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import type { DatabaseRow } from "./postgres-modifiers.repository.types";

export class PostgresModifiersRepository implements ModifiersUnitOfWork {
  constructor(private readonly runner: PostgresCatalogCommandRunner) {}
  async run<Result>(
    command: (repository: ModifiersRepository) => Promise<Result>,
    audit: (repository: ModifiersRepository, result: Result) => Promise<void>,
  ): Promise<Result> {
    return this.runner.run(
      (client) => command(new PostgresModifiersTransactionRepository(client)),
      (client, result) =>
        audit(new PostgresModifiersTransactionRepository(client), result),
    );
  }
}
class PostgresModifiersTransactionRepository implements ModifiersRepository {
  constructor(private readonly client: PoolClient) {}
  async findGroupById(id: string): Promise<AdminModifierGroup | null> {
    return (await this.findGroups("WHERE id = $1", [id]))[0] ?? null;
  }
  async findOptionById(id: string): Promise<AdminModifierOption | null> {
    return (await this.findOptions("WHERE id = $1", [id]))[0] ?? null;
  }
  async findCurrentOptionsByGroup(
    groupId: string,
  ): Promise<AdminModifierOption[]> {
    return this.findOptions("WHERE group_id = $1 AND archived_at IS NULL", [
      groupId,
    ]);
  }
  async createGroup(
    details: ModifierGroupDetails,
    options: readonly ModifierOptionInput[],
  ): Promise<AdminModifierGroup> {
    const result = await this.client.query<DatabaseRow>(
      "INSERT INTO modifier_groups (name, selection_type, min_select, max_select, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        details.name,
        details.selectionType,
        details.minSelect,
        details.maxSelect,
        details.isActive,
      ],
    );
    const id = requiredId(result.rows[0]);
    await this.syncOptions(id, options);
    return requiredGroup(await this.findGroupById(id));
  }
  async updateGroup(
    id: string,
    details: ModifierGroupDetails,
    options: readonly ModifierOptionInput[],
  ): Promise<AdminModifierGroup> {
    await this.client.query(
      "UPDATE modifier_groups SET name = $2, selection_type = $3, min_select = $4, max_select = $5, is_active = $6 WHERE id = $1 AND archived_at IS NULL",
      [
        id,
        details.name,
        details.selectionType,
        details.minSelect,
        details.maxSelect,
        details.isActive,
      ],
    );
    await this.syncOptions(id, options);
    return requiredGroup(await this.findGroupById(id));
  }
  async archiveGroup(id: string): Promise<AdminModifierGroup> {
    const result = await this.client.query<DatabaseRow>(
      "UPDATE modifier_groups SET archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND archived_at IS NULL RETURNING id",
      [id],
    );
    return requiredGroup(await this.findGroupById(requiredId(result.rows[0])));
  }
  async createOption(
    groupId: string,
    details: ModifierOptionDetails,
  ): Promise<AdminModifierOption> {
    const result = await this.client.query<DatabaseRow>(
      "INSERT INTO modifier_options (group_id, name, price_delta, sort_order, is_default, is_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [
        groupId,
        details.name,
        details.priceDelta,
        details.sortOrder,
        details.isDefault,
        details.isAvailable,
      ],
    );
    return requiredOption(
      await this.findOptionById(requiredId(result.rows[0])),
    );
  }
  async updateOption(
    id: string,
    details: ModifierOptionDetails,
  ): Promise<AdminModifierOption> {
    await this.client.query(
      "UPDATE modifier_options SET name = $2, price_delta = $3, sort_order = $4, is_default = $5, is_available = $6 WHERE id = $1 AND archived_at IS NULL",
      [
        id,
        details.name,
        details.priceDelta,
        details.sortOrder,
        details.isDefault,
        details.isAvailable,
      ],
    );
    return requiredOption(await this.findOptionById(id));
  }
  async reorderOptions(
    options: readonly AdminModifierOption[],
    optionIds: readonly string[],
  ): Promise<AdminModifierOption[]> {
    await this.client.query(
      "UPDATE modifier_options SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[]) AND archived_at IS NULL",
      [options.map((option) => option.id)],
    );
    await this.client.query(
      "UPDATE modifier_options AS option SET sort_order = ordered.sort_order - 1 FROM unnest($1::uuid[]) WITH ORDINALITY AS ordered(id, sort_order) WHERE option.id = ordered.id",
      [optionIds],
    );
    await this.client.query(
      "UPDATE modifier_options SET archived_at = NULL WHERE id = ANY($1::uuid[])",
      [options.map((option) => option.id)],
    );
    return this.findOptions("WHERE id = ANY($1::uuid[])", [optionIds]);
  }
  async archiveOption(id: string): Promise<AdminModifierOption> {
    const result = await this.client.query<DatabaseRow>(
      "UPDATE modifier_options SET archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND archived_at IS NULL RETURNING id",
      [id],
    );
    return requiredOption(
      await this.findOptionById(requiredId(result.rows[0])),
    );
  }
  async writeAudit(event: ModifierAuditEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
      [
        event.actorId,
        event.entityType,
        event.entityId,
        event.action,
        JSON.stringify(event.before),
        JSON.stringify(event.after),
        event.requestId,
      ],
    );
  }
  private async findGroups(
    where: string,
    values: unknown[],
  ): Promise<AdminModifierGroup[]> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT id, name, selection_type, min_select, max_select, is_active, archived_at FROM modifier_groups ${where} ORDER BY id`,
      values,
    );
    const groups = result.rows.map(parseGroup);
    if (groups.length === 0) return [];
    const options = await this.findOptions(
      "WHERE group_id = ANY($1::uuid[]) AND archived_at IS NULL",
      [groups.map((group) => group.id)],
    );
    return groups.map((group) => ({
      ...group,
      options: options.filter((option) => option.groupId === group.id),
    }));
  }
  private async findOptions(
    where: string,
    values: unknown[],
  ): Promise<AdminModifierOption[]> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT id, group_id, name, price_delta, sort_order, is_default, is_available, archived_at FROM modifier_options ${where} ORDER BY sort_order, id`,
      values,
    );
    return result.rows.map(parseOption);
  }
  private async syncOptions(
    groupId: string,
    options: readonly ModifierOptionInput[],
  ): Promise<void> {
    await this.client.query(
      "UPDATE modifier_options SET archived_at = CURRENT_TIMESTAMP WHERE group_id = $1 AND archived_at IS NULL",
      [groupId],
    );
    for (const option of options) {
      if (option.id === undefined) await this.createOption(groupId, option);
      else
        await this.client.query(
          "UPDATE modifier_options SET name = $3, price_delta = $4, sort_order = $5, is_default = $6, is_available = $7, archived_at = NULL WHERE id = $1 AND group_id = $2",
          [
            option.id,
            groupId,
            option.name,
            option.priceDelta,
            option.sortOrder,
            option.isDefault,
            option.isAvailable,
          ],
        );
    }
  }
}
function requiredId(row: DatabaseRow | undefined): string {
  if (row === undefined) throw new Error("Modifier command returned no row");
  return readUuid(row, "id");
}
function requiredGroup(value: AdminModifierGroup | null): AdminModifierGroup {
  if (value === null) throw new Error("Modifier command returned no row");
  return value;
}
function requiredOption(
  value: AdminModifierOption | null,
): AdminModifierOption {
  if (value === null) throw new Error("Modifier command returned no row");
  return value;
}
function parseGroup(row: DatabaseRow): AdminModifierGroup {
  const selectionType = readString(row, "selection_type");
  const minSelect = readNonNegativeInteger(row, "min_select");
  const maxSelect = readNonNegativeInteger(row, "max_select");
  if (selectionType !== "single" && selectionType !== "multiple")
    throw invalidRow("selection_type");
  if (maxSelect < minSelect || (selectionType === "single" && maxSelect !== 1))
    throw invalidRow("modifier group invariant");
  return {
    id: readUuid(row, "id"),
    name: readNonBlankString(row, "name"),
    selectionType,
    minSelect,
    maxSelect,
    isActive: readBoolean(row, "is_active"),
    archivedAt: readNullableDate(row, "archived_at"),
    options: [],
  };
}
function parseOption(row: DatabaseRow): AdminModifierOption {
  return {
    id: readUuid(row, "id"),
    groupId: readUuid(row, "group_id"),
    name: readNonBlankString(row, "name"),
    priceDelta: readNonNegativeInteger(row, "price_delta"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isDefault: readBoolean(row, "is_default"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}
function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw invalidRow(key);
  return value;
}
function readNonBlankString(row: DatabaseRow, key: string): string {
  const value = readString(row, key);
  if (value.trim() === "") throw invalidRow(key);
  return value;
}
function readUuid(row: DatabaseRow, key: string): string {
  const value = readString(row, key);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw invalidRow(key);
  return value;
}
function readBoolean(row: DatabaseRow, key: string): boolean {
  const value = row[key];
  if (typeof value !== "boolean")
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}
function readInteger(row: DatabaseRow, key: string): number {
  const value = row[key];
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < -2_147_483_647 ||
    value > 2_147_483_647
  )
    throw invalidRow(key);
  return value;
}
function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);
  if (value < 0) throw invalidRow(key);
  return value;
}
function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime()))
    throw invalidRow(key);
  return value;
}
function invalidRow(key: string): Error {
  return new Error("Invalid PostgreSQL row field: " + key);
}
