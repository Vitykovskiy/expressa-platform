import type { PoolClient } from 'pg';
import type { CategoriesRepository, CategoriesUnitOfWork, CategoryAuditEvent } from '../application/categories.repository.types';
import type { AdminCategory, CategoryDetails } from '../domain/category-admin.policy.types';
import { PostgresCatalogCommandRunner } from './postgres-catalog-command.runner';
import type { DatabaseRow } from './postgres-categories.repository.types';

export class PostgresCategoriesRepository implements CategoriesUnitOfWork {
  constructor(private readonly runner: PostgresCatalogCommandRunner) {}

  async run<Result>(
    command: (repository: CategoriesRepository) => Promise<Result>,
    audit: (repository: CategoriesRepository, result: Result) => Promise<void>,
  ): Promise<Result> {
    return this.runner.run(
      (client) => command(new PostgresCategoriesTransactionRepository(client)),
      (client, result) => audit(new PostgresCategoriesTransactionRepository(client), result),
    );
  }
}

class PostgresCategoriesTransactionRepository implements CategoriesRepository {
  constructor(private readonly client: PoolClient) {}

  async findById(id: string): Promise<AdminCategory | null> {
    const client = this.client;
    const result = await client.query<DatabaseRow>(
      `SELECT id, name, description, sort_order, is_active, archived_at
       FROM categories WHERE id = $1`,
      [id],
    );
    return result.rows[0] === undefined ? null : parseCategory(result.rows[0]);
  }

  async findCurrent(): Promise<AdminCategory[]> {
    const client = this.client;
    const result = await client.query<DatabaseRow>(
      `SELECT id, name, description, sort_order, is_active, archived_at
       FROM categories WHERE archived_at IS NULL ORDER BY sort_order, id`,
    );
    return result.rows.map(parseCategory);
  }

  async create(details: CategoryDetails): Promise<AdminCategory> {
    const client = this.client;
    const result = await client.query<DatabaseRow>(
      `INSERT INTO categories (name, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, sort_order, is_active, archived_at`,
      [details.name, details.description, details.sortOrder, details.isActive],
    );
    return parseRequiredCategory(result.rows[0]);
  }

  async update(id: string, details: CategoryDetails): Promise<AdminCategory> {
    const client = this.client;
    const result = await client.query<DatabaseRow>(
      `UPDATE categories
       SET name = $2, description = $3, sort_order = $4, is_active = $5
       WHERE id = $1 AND archived_at IS NULL
       RETURNING id, name, description, sort_order, is_active, archived_at`,
      [id, details.name, details.description, details.sortOrder, details.isActive],
    );
    return parseRequiredCategory(result.rows[0]);
  }

  async reorder(categories: readonly AdminCategory[], categoryIds: readonly string[]): Promise<AdminCategory[]> {
    const client = this.client;
    const activeCategoryIds = categories.filter((category) => category.isActive).map((category) => category.id);
    await client.query(
      `UPDATE categories SET is_active = false
       WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
      [activeCategoryIds],
    );
    await client.query(
      `UPDATE categories AS category
       SET sort_order = ordered.sort_order + $2
       FROM unnest($1::uuid[]) WITH ORDINALITY AS ordered(id, sort_order)
       WHERE category.id = ordered.id`,
      [categoryIds, activeCategoryIds.length - 1],
    );
    await client.query(
      `UPDATE categories AS category
       SET sort_order = ordered.sort_order - 1
       FROM unnest($1::uuid[]) WITH ORDINALITY AS ordered(id, sort_order)
       WHERE category.id = ordered.id`,
      [categoryIds],
    );
    await client.query(
      `UPDATE categories SET is_active = true
       WHERE id = ANY($1::uuid[]) AND archived_at IS NULL`,
      [activeCategoryIds],
    );
    const result = await client.query<DatabaseRow>(
      `SELECT id, name, description, sort_order, is_active, archived_at
       FROM categories WHERE id = ANY($1::uuid[]) ORDER BY sort_order, id`,
      [categoryIds],
    );
    return result.rows.map(parseCategory);
  }

  async archive(id: string): Promise<AdminCategory> {
    const client = this.client;
    const result = await client.query<DatabaseRow>(
      `UPDATE categories SET archived_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND archived_at IS NULL
       RETURNING id, name, description, sort_order, is_active, archived_at`,
      [id],
    );
    return parseRequiredCategory(result.rows[0]);
  }

  async writeAudit(event: CategoryAuditEvent): Promise<void> {
    const client = this.client;
    await client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id)
       VALUES ($1, 'category', $2, $3, $4::jsonb, $5::jsonb, $6)`,
      [event.actorId, event.categoryId, event.action, JSON.stringify(event.before), JSON.stringify(event.after), event.requestId],
    );
  }
}

function parseRequiredCategory(row: DatabaseRow | undefined): AdminCategory {
  if (row === undefined) throw new Error('Category command returned no row');
  return parseCategory(row);
}

function parseCategory(row: DatabaseRow): AdminCategory {
  return {
    id: readString(row, 'id'),
    name: readString(row, 'name'),
    description: readString(row, 'description'),
    sortOrder: readNonNegativeInteger(row, 'sort_order'),
    isActive: readBoolean(row, 'is_active'),
    archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new Error('Invalid PostgreSQL row field: ' + key);
  return value;
}

function readBoolean(row: DatabaseRow, key: string): boolean {
  const value = row[key];
  if (typeof value !== 'boolean') throw new Error('Invalid PostgreSQL row field: ' + key);
  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = row[key];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}

function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error('Invalid PostgreSQL row field: ' + key);
  }
  return value;
}
