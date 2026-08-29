import type { Pool } from "pg";
import { AvailabilityNotFoundError } from "../application/manage-availability.use-case";
import type {
  AdminCatalogCandidates,
  AdminCatalogRepository,
  AvailabilityCommand,
  AvailabilityRepository,
  AvailabilityTarget,
  ServiceIntake,
  ServiceIntakeCommand,
} from "../application/admin-catalog.repository.types";
import {
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from "../domain/catalog.constants";
import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogModifierSelectionType,
  CatalogProductCandidate,
  CatalogProductSize,
  CatalogProductType,
  CatalogProductVariantCandidate,
} from "../domain/catalog.types";
import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from "./catalog-advisory-lock.constants";
import type { DatabaseRow } from "./postgres-admin-catalog.repository.types";

export class PostgresAdminCatalogRepository
  implements AdminCatalogRepository, AvailabilityRepository
{
  constructor(private readonly pool: Pool) {}

  async findCandidates(): Promise<AdminCatalogCandidates> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);

      const [
        settings,
        categories,
        products,
        productVariants,
        modifierGroups,
        modifierOptions,
        categoryModifierGroups,
      ] = await Promise.all([
        client.query<DatabaseRow>(
          `SELECT s.value, s.updated_by, u.phone_e164 AS updated_by_label, s.updated_at
             FROM service_settings s
             LEFT JOIN users u ON u.id = s.updated_by
             WHERE s.key = 'accepts_new_orders'`,
        ),
        client.query<DatabaseRow>(
          `SELECT c.id, c.name, c.description, c.sort_order, c.is_active, c.archived_at
             FROM categories c
             WHERE c.archived_at IS NULL
             ORDER BY c.sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT p.id, p.category_id, p.type, p.name, p.description, p.price_minor, p.sort_order, p.is_active, p.is_available, p.archived_at
             FROM products p
             INNER JOIN categories c ON c.id = p.category_id
             WHERE p.archived_at IS NULL AND c.archived_at IS NULL
             ORDER BY p.category_id, p.sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT v.id, v.product_id, v.size, v.price_minor, v.sort_order, v.is_available, v.archived_at
             FROM product_variants v
             INNER JOIN products p ON p.id = v.product_id
             INNER JOIN categories c ON c.id = p.category_id
             WHERE v.archived_at IS NULL AND p.archived_at IS NULL AND c.archived_at IS NULL
             ORDER BY v.product_id, v.sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT g.id, g.name, g.selection_type, g.min_select, g.max_select, g.is_active, g.archived_at
             FROM modifier_groups g
             WHERE g.archived_at IS NULL
             ORDER BY g.id`,
        ),
        client.query<DatabaseRow>(
          `SELECT o.id, o.group_id, o.name, o.price_delta_minor, o.sort_order, o.is_default, o.is_available, o.archived_at
             FROM modifier_options o
             INNER JOIN modifier_groups g ON g.id = o.group_id
             WHERE o.archived_at IS NULL AND g.archived_at IS NULL
             ORDER BY o.group_id, o.sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT cmg.category_id, cmg.group_id, cmg.sort_order
             FROM category_modifier_groups cmg
             INNER JOIN categories c ON c.id = cmg.category_id
             INNER JOIN modifier_groups g ON g.id = cmg.group_id
             WHERE c.archived_at IS NULL AND g.archived_at IS NULL
             ORDER BY cmg.category_id, cmg.sort_order`,
        ),
      ]);

      const candidates = {
        intake: parseServiceIntake(settings.rows),
        categories: categories.rows.map(parseCategory),
        products: products.rows.map(parseProduct),
        productVariants: productVariants.rows.map(parseProductVariant),
        modifierGroups: modifierGroups.rows.map(parseModifierGroup),
        modifierOptions: modifierOptions.rows.map(parseModifierOption),
        categoryModifierGroups: categoryModifierGroups.rows.map(
          parseCategoryModifierGroup,
        ),
      };

      await client.query("COMMIT");
      return candidates;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAvailability(
    command: AvailabilityCommand,
  ): Promise<AvailabilityTarget> {
    const client = await this.pool.connect();
    const table =
      command.type === "product"
        ? "products"
        : command.type === "variant"
          ? "product_variants"
          : "modifier_options";
    const entityType =
      command.type === "modifier" ? "modifier_option" : command.type;

    try {
      await client.query("BEGIN");
      await client.query(publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);
      const before = await client.query<DatabaseRow>(
        `SELECT id, is_available FROM ${table} WHERE id = $1 AND archived_at IS NULL`,
        [command.id],
      );
      if (before.rows.length !== 1) throw new AvailabilityNotFoundError();
      const after = await client.query<DatabaseRow>(
        `UPDATE ${table} SET is_available = $2 WHERE id = $1 AND archived_at IS NULL RETURNING id, is_available`,
        [command.id, command.isAvailable],
      );
      const target = parseAvailabilityTarget(command.type, after.rows);
      await client.query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id)
         VALUES ($1, $2, $3, 'AVAILABILITY_UPDATED', $4::jsonb, $5::jsonb, $6)`,
        [
          command.actorId,
          entityType,
          command.id,
          JSON.stringify(parseAvailabilityTarget(command.type, before.rows)),
          JSON.stringify(target),
          command.requestId,
        ],
      );
      await client.query("COMMIT");
      return target;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateServiceIntake(
    command: ServiceIntakeCommand,
  ): Promise<ServiceIntake> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);
      const before = await client.query<DatabaseRow>(
        `SELECT s.id, s.value, s.updated_by, u.phone_e164 AS updated_by_label, s.updated_at
         FROM service_settings s
         LEFT JOIN users u ON u.id = s.updated_by
         WHERE s.key = 'accepts_new_orders'`,
      );
      if (before.rows.length !== 1)
        throw new Error(
          "Invalid PostgreSQL service setting: accepts_new_orders",
        );
      const row = before.rows[0]!;
      const after = await client.query<DatabaseRow>(
        `WITH updated AS (
           UPDATE service_settings
           SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
           WHERE key = 'accepts_new_orders'
           RETURNING id, value, updated_by, updated_at
         )
         SELECT updated.id, updated.value, updated.updated_by,
                users.phone_e164 AS updated_by_label, updated.updated_at
         FROM updated
         LEFT JOIN users ON users.id = updated.updated_by`,
        [command.acceptsNewOrders, command.actorId],
      );
      const intake = parseServiceIntake(after.rows);
      await client.query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id)
         VALUES ($1, 'service_setting', $2, 'SERVICE_INTAKE_UPDATED', $3::jsonb, $4::jsonb, $5)`,
        [
          command.actorId,
          readString(row, "id"),
          JSON.stringify(parseServiceIntake(before.rows)),
          JSON.stringify(intake),
          command.requestId,
        ],
      );
      await client.query("COMMIT");
      return intake;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function parseServiceIntake(rows: DatabaseRow[]): ServiceIntake {
  if (rows.length !== 1)
    throw new Error("Invalid PostgreSQL service setting: accepts_new_orders");
  const row = rows[0]!;
  return {
    acceptsNewOrders: readBoolean(row, "value"),
    updatedBy: readNullableString(row, "updated_by"),
    updatedByLabel: readNullableString(row, "updated_by_label"),
    updatedAt: readNullableDate(row, "updated_at"),
  };
}

function parseAvailabilityTarget(
  type: AvailabilityTarget["type"],
  rows: DatabaseRow[],
): AvailabilityTarget {
  if (rows.length !== 1)
    throw new Error("Invalid PostgreSQL availability update");
  const row = rows[0]!;
  return {
    type,
    id: readString(row, "id"),
    isAvailable: readBoolean(row, "is_available"),
  };
}

function parseCategory(row: DatabaseRow): CatalogCategoryCandidate {
  return {
    id: readString(row, "id"),
    name: readString(row, "name"),
    description: readString(row, "description"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isActive: readBoolean(row, "is_active"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseProduct(row: DatabaseRow): CatalogProductCandidate {
  return {
    id: readString(row, "id"),
    categoryId: readString(row, "category_id"),
    type: readProductType(row),
    name: readString(row, "name"),
    description: readString(row, "description"),
    priceMinor: readNullableInteger(row, "price_minor"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isActive: readBoolean(row, "is_active"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseProductVariant(row: DatabaseRow): CatalogProductVariantCandidate {
  return {
    id: readString(row, "id"),
    productId: readString(row, "product_id"),
    size: readProductSize(row),
    priceMinor: readNonNegativeInteger(row, "price_minor"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseModifierGroup(row: DatabaseRow): CatalogModifierGroupCandidate {
  return {
    id: readString(row, "id"),
    name: readString(row, "name"),
    selectionType: readModifierSelectionType(row),
    minSelect: readNonNegativeInteger(row, "min_select"),
    maxSelect: readNonNegativeInteger(row, "max_select"),
    isActive: readBoolean(row, "is_active"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseModifierOption(row: DatabaseRow): CatalogModifierOptionCandidate {
  return {
    id: readString(row, "id"),
    groupId: readString(row, "group_id"),
    name: readString(row, "name"),
    priceDeltaMinor: readInteger(row, "price_delta_minor"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isDefault: readBoolean(row, "is_default"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseCategoryModifierGroup(
  row: DatabaseRow,
): CatalogCategoryModifierGroupCandidate {
  return {
    categoryId: readString(row, "category_id"),
    groupId: readString(row, "group_id"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
  };
}

function readProductType(row: DatabaseRow): CatalogProductType {
  const value = readString(row, "type");
  if (!productTypes.some((type) => type === value))
    throw new Error("Invalid PostgreSQL row field: type");
  return value as CatalogProductType;
}

function readProductSize(row: DatabaseRow): CatalogProductSize {
  const value = readString(row, "size");
  if (!productSizes.some((size) => size === value))
    throw new Error("Invalid PostgreSQL row field: size");
  return value as CatalogProductSize;
}

function readModifierSelectionType(
  row: DatabaseRow,
): CatalogModifierSelectionType {
  const value = readString(row, "selection_type");
  if (!modifierSelectionTypes.some((type) => type === value))
    throw new Error("Invalid PostgreSQL row field: selection_type");
  return value as CatalogModifierSelectionType;
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];
  if (typeof value !== "string")
    throw new Error("Invalid PostgreSQL row field: " + key);
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
  if (typeof value !== "number" || !Number.isInteger(value))
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);
  if (value < 0) throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}

function readNullableInteger(row: DatabaseRow, key: string): number | null {
  const value = row[key];
  return value === null ? null : readInteger(row, key);
}

function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime()))
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}

function readNullableString(row: DatabaseRow, key: string): string | null {
  const value = row[key];
  return value === null ? null : readString(row, key);
}
