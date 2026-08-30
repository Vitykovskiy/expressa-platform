import type { PoolClient } from "pg";
import type {
  CategoryModifierGroup,
  CategoryModifierGroupsAuditEvent,
  CategoryModifiersRepository,
  CategoryModifiersUnitOfWork,
} from "../application/category-modifiers.repository.types";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import type { DatabaseRow } from "./postgres-category-modifiers.repository.types";

export class PostgresCategoryModifiersRepository implements CategoryModifiersUnitOfWork {
  constructor(private readonly runner: PostgresCatalogCommandRunner) {}

  async run<Result>(
    command: (repository: CategoryModifiersRepository) => Promise<Result>,
    audit: (
      repository: CategoryModifiersRepository,
      result: Result,
    ) => Promise<void>,
  ): Promise<Result> {
    return this.runner.run(
      (client) =>
        command(new PostgresCategoryModifiersTransactionRepository(client)),
      (client, result) =>
        audit(
          new PostgresCategoryModifiersTransactionRepository(client),
          result,
        ),
    );
  }
}

class PostgresCategoryModifiersTransactionRepository implements CategoryModifiersRepository {
  constructor(private readonly client: PoolClient) {}

  async categoryExists(categoryId: string): Promise<boolean> {
    const result = await this.client.query<DatabaseRow>(
      "SELECT id FROM categories WHERE id = $1 AND archived_at IS NULL",
      [categoryId],
    );
    return result.rows.length === 1;
  }

  async findCurrentModifierGroupIds(
    groupIds: readonly string[],
  ): Promise<readonly string[]> {
    if (groupIds.length === 0) return [];
    const result = await this.client.query<DatabaseRow>(
      `SELECT id FROM modifier_groups
       WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
      [groupIds],
    );
    return result.rows.map((row) => readString(row, "id"));
  }

  async findByCategoryId(
    categoryId: string,
  ): Promise<readonly CategoryModifierGroup[]> {
    const result = await this.client.query<DatabaseRow>(
      `SELECT category_id, group_id, sort_order FROM category_modifier_groups
       WHERE category_id = $1 ORDER BY sort_order, group_id`,
      [categoryId],
    );
    return result.rows.map(parseAssignment);
  }

  async replace(
    categoryId: string,
    groupIds: readonly string[],
  ): Promise<readonly CategoryModifierGroup[]> {
    await this.client.query(
      "DELETE FROM category_modifier_groups WHERE category_id = $1",
      [categoryId],
    );
    if (groupIds.length === 0) return [];
    const result = await this.client.query<DatabaseRow>(
      `INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
       SELECT $1, group_id, sort_order - 1
       FROM unnest($2::uuid[]) WITH ORDINALITY AS ordered(group_id, sort_order)
       RETURNING category_id, group_id, sort_order`,
      [categoryId, groupIds],
    );
    return result.rows
      .map(parseAssignment)
      .toSorted((left, right) => left.sortOrder - right.sortOrder);
  }

  async writeAudit(event: CategoryModifierGroupsAuditEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id)
       VALUES ($1, 'category_modifier_groups', $2, 'CATEGORY_MODIFIER_GROUPS_REPLACED', $3::jsonb, $4::jsonb, $5)`,
      [
        event.actorId,
        event.categoryId,
        JSON.stringify(event.before),
        JSON.stringify(event.after),
        event.requestId,
      ],
    );
  }
}

function parseAssignment(row: DatabaseRow): CategoryModifierGroup {
  return {
    categoryId: readString(row, "category_id"),
    groupId: readString(row, "group_id"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
  };
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== "string")
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }
  return value;
}
