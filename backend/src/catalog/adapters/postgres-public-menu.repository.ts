import type { Pool } from "pg";
import type {
  PublicMenuCandidates,
  PublicMenuRepository,
  PublicMenuV3Candidates,
} from "../application/public-menu.repository.types";
import {
  acceptsNewOrdersSettingKey,
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from "../domain/catalog.constants";
import type {
  CatalogCategoryCandidate,
  CatalogCategoryModifierGroupCandidate,
  CatalogModifierGroupCandidate,
  CatalogModifierOptionCandidate,
  CatalogProductCandidate,
  CatalogProductSize,
  CatalogProductType,
  CatalogProductVariantCandidate,
  CatalogModifierSelectionType,
} from "../domain/catalog.types";
import type { DatabaseRow } from "./postgres-public-menu.repository.types";
import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from "./catalog-advisory-lock.constants";

export class PostgresPublicMenuRepository implements PublicMenuRepository {
  constructor(private readonly pool: Pool) {}

  async findCandidates(): Promise<PublicMenuCandidates> {
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
          `SELECT value
             FROM service_settings
             WHERE key = $1`,
          [acceptsNewOrdersSettingKey],
        ),
        client.query<DatabaseRow>(
          `SELECT id, name, description, sort_order, is_active, archived_at
             FROM categories
             ORDER BY sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT id, category_id, type, name, description, display_label, price, sort_order, is_active, is_available, archived_at
             FROM products
             ORDER BY sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT id, product_id, size, display_label, price, sort_order, is_available, archived_at
             FROM product_variants
             ORDER BY sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT id, name, selection_type, min_select, max_select, is_active, archived_at
             FROM modifier_groups`,
        ),
        client.query<DatabaseRow>(
          `SELECT id, group_id, name, price_delta, sort_order, is_default, is_available, archived_at
             FROM modifier_options
             ORDER BY sort_order`,
        ),
        client.query<DatabaseRow>(
          `SELECT category_id, NULL::uuid AS product_id, group_id, sort_order
             FROM category_modifier_groups
           UNION ALL
           SELECT NULL::uuid AS category_id, product_id, group_id, sort_order
             FROM product_modifier_groups
           ORDER BY sort_order`,
        ),
      ]);

      const candidates = {
        acceptsNewOrders: readAcceptsNewOrders(settings.rows),
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

  async findV3Candidates(): Promise<PublicMenuV3Candidates> {
    const [settings, categories, products, choices] = await Promise.all([
      this.pool.query<DatabaseRow>(
        "SELECT value FROM service_settings WHERE key = $1",
        [acceptsNewOrdersSettingKey],
      ),
      this.pool.query<DatabaseRow>(
        "SELECT id, name, description, sort_order, is_active, archived_at FROM categories ORDER BY sort_order",
      ),
      this.pool.query<DatabaseRow>(
        "SELECT id, category_id, type, name, description, portion_label, price, sort_order, is_active, is_available, archived_at FROM products ORDER BY sort_order",
      ),
      this.pool.query<DatabaseRow>(
        "SELECT id, product_id, portion_label, price, sort_order, is_available, archived_at FROM product_price_choices ORDER BY product_id, sort_order",
      ),
    ]);
    return {
      acceptsNewOrders: readAcceptsNewOrders(settings.rows),
      categories: categories.rows.map(parseCategory),
      products: products.rows.map((row) => ({
        ...parseProduct(row),
        displayLabel: readNullableString(row, "portion_label"),
      })),
      priceChoices: choices.rows.map((row) => ({
        id: readString(row, "id"),
        productId: readString(row, "product_id"),
        portionLabel: readString(row, "portion_label"),
        price: readNonNegativeInteger(row, "price"),
        sortOrder: readNonNegativeInteger(row, "sort_order"),
        isAvailable: readBoolean(row, "is_available"),
        archivedAt: readNullableDate(row, "archived_at"),
      })),
    };
  }
}

function readAcceptsNewOrders(rows: DatabaseRow[]): boolean {
  if (rows.length !== 1) {
    throw new Error("Invalid PostgreSQL service setting: accepts_new_orders");
  }

  const value = rows[0]!["value"];

  if (typeof value !== "boolean") {
    throw new Error("Invalid PostgreSQL service setting: accepts_new_orders");
  }

  return value;
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
    displayLabel: readNullableString(row, "display_label"),
    price: readNullableInteger(row, "price"),
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
    displayLabel: readNullableString(row, "display_label"),
    price: readNonNegativeInteger(row, "price"),
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
    priceDelta: readInteger(row, "price_delta"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isDefault: readBoolean(row, "is_default"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}

function parseCategoryModifierGroup(
  row: DatabaseRow,
): CatalogCategoryModifierGroupCandidate & { productId?: string } {
  return {
    categoryId:
      row["category_id"] === null || row["category_id"] === undefined
        ? ""
        : readString(row, "category_id"),
    ...(row["product_id"] === null || row["product_id"] === undefined
      ? {}
      : { productId: readString(row, "product_id") }),
    groupId: readString(row, "group_id"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
  };
}

function readProductType(row: DatabaseRow): CatalogProductType {
  const value = readString(row, "type");

  if (!productTypes.some((type) => type === value)) {
    throw new Error("Invalid PostgreSQL row field: type");
  }

  return value as CatalogProductType;
}

function readProductSize(row: DatabaseRow): CatalogProductSize {
  const value = readString(row, "size");

  if (!productSizes.some((size) => size === value)) {
    throw new Error("Invalid PostgreSQL row field: size");
  }

  return value as CatalogProductSize;
}

function readModifierSelectionType(
  row: DatabaseRow,
): CatalogModifierSelectionType {
  const value = readString(row, "selection_type");

  if (!modifierSelectionTypes.some((type) => type === value)) {
    throw new Error("Invalid PostgreSQL row field: selection_type");
  }

  return value as CatalogModifierSelectionType;
}

function readString(row: DatabaseRow, key: string): string {
  const value = row[key];

  if (typeof value !== "string") {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }

  return value;
}

function readBoolean(row: DatabaseRow, key: string): boolean {
  const value = row[key];

  if (typeof value !== "boolean") {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }

  return value;
}

function readInteger(row: DatabaseRow, key: string): number {
  const value = row[key];

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }

  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);

  if (value < 0) {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }

  return value;
}

function readNullableInteger(row: DatabaseRow, key: string): number | null {
  const value = row[key];

  if (value === null) {
    return null;
  }

  return readInteger(row, key);
}

function readNullableString(
  row: DatabaseRow,
  key: string,
): string | null | undefined {
  const value = row[key];
  return value === undefined || value === null ? value : readString(row, key);
}

function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];

  if (value === null) {
    return null;
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error("Invalid PostgreSQL row field: " + key);
  }

  return value;
}
