import type { Pool } from 'pg';
import type { AdminCatalogCandidates, AdminCatalogRepository } from '../application/admin-catalog.repository.types';
import {
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from '../domain/catalog.constants';
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
} from '../domain/catalog.types';
import {
  catalogAdvisoryLockKey,
  publicMenuAdvisoryLockSql,
} from './catalog-advisory-lock.constants';
import type { DatabaseRow } from './postgres-admin-catalog.repository.types';

export class PostgresAdminCatalogRepository implements AdminCatalogRepository {
  constructor(private readonly pool: Pool) {}

  async findCandidates(): Promise<AdminCatalogCandidates> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(publicMenuAdvisoryLockSql, [catalogAdvisoryLockKey]);

      const [categories, products, productVariants, modifierGroups, modifierOptions, categoryModifierGroups] =
        await Promise.all([
          client.query<DatabaseRow>(
            `SELECT id, name, description, sort_order, is_active, archived_at
             FROM categories
             WHERE archived_at IS NULL
             ORDER BY sort_order`,
          ),
          client.query<DatabaseRow>(
            `SELECT id, category_id, type, name, description, price_minor, sort_order, is_active, is_available, archived_at
             FROM products
             WHERE archived_at IS NULL
             ORDER BY category_id, sort_order`,
          ),
          client.query<DatabaseRow>(
            `SELECT id, product_id, size, price_minor, sort_order, is_available, archived_at
             FROM product_variants
             WHERE archived_at IS NULL
             ORDER BY product_id, sort_order`,
          ),
          client.query<DatabaseRow>(
            `SELECT id, name, selection_type, min_select, max_select, is_active, archived_at
             FROM modifier_groups
             WHERE archived_at IS NULL
             ORDER BY id`,
          ),
          client.query<DatabaseRow>(
            `SELECT id, group_id, name, price_delta_minor, sort_order, is_default, is_available, archived_at
             FROM modifier_options
             WHERE archived_at IS NULL
             ORDER BY group_id, sort_order`,
          ),
          client.query<DatabaseRow>(
            `SELECT category_id, group_id, sort_order
             FROM category_modifier_groups
             ORDER BY category_id, sort_order`,
          ),
        ]);

      const candidates = {
        categories: categories.rows.map(parseCategory),
        products: products.rows.map(parseProduct),
        productVariants: productVariants.rows.map(parseProductVariant),
        modifierGroups: modifierGroups.rows.map(parseModifierGroup),
        modifierOptions: modifierOptions.rows.map(parseModifierOption),
        categoryModifierGroups: categoryModifierGroups.rows.map(parseCategoryModifierGroup),
      };

      await client.query('COMMIT');
      return candidates;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

function parseCategory(row: DatabaseRow): CatalogCategoryCandidate {
  return {
    id: readString(row, 'id'), name: readString(row, 'name'), description: readString(row, 'description'),
    sortOrder: readNonNegativeInteger(row, 'sort_order'), isActive: readBoolean(row, 'is_active'),
    archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function parseProduct(row: DatabaseRow): CatalogProductCandidate {
  return {
    id: readString(row, 'id'), categoryId: readString(row, 'category_id'), type: readProductType(row),
    name: readString(row, 'name'), description: readString(row, 'description'),
    priceMinor: readNullableInteger(row, 'price_minor'), sortOrder: readNonNegativeInteger(row, 'sort_order'),
    isActive: readBoolean(row, 'is_active'), isAvailable: readBoolean(row, 'is_available'),
    archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function parseProductVariant(row: DatabaseRow): CatalogProductVariantCandidate {
  return {
    id: readString(row, 'id'), productId: readString(row, 'product_id'), size: readProductSize(row),
    priceMinor: readNonNegativeInteger(row, 'price_minor'), sortOrder: readNonNegativeInteger(row, 'sort_order'),
    isAvailable: readBoolean(row, 'is_available'), archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function parseModifierGroup(row: DatabaseRow): CatalogModifierGroupCandidate {
  return {
    id: readString(row, 'id'), name: readString(row, 'name'), selectionType: readModifierSelectionType(row),
    minSelect: readNonNegativeInteger(row, 'min_select'), maxSelect: readNonNegativeInteger(row, 'max_select'),
    isActive: readBoolean(row, 'is_active'), archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function parseModifierOption(row: DatabaseRow): CatalogModifierOptionCandidate {
  return {
    id: readString(row, 'id'), groupId: readString(row, 'group_id'), name: readString(row, 'name'),
    priceDeltaMinor: readInteger(row, 'price_delta_minor'), sortOrder: readNonNegativeInteger(row, 'sort_order'),
    isDefault: readBoolean(row, 'is_default'), isAvailable: readBoolean(row, 'is_available'),
    archivedAt: readNullableDate(row, 'archived_at'),
  };
}

function parseCategoryModifierGroup(row: DatabaseRow): CatalogCategoryModifierGroupCandidate {
  return {
    categoryId: readString(row, 'category_id'), groupId: readString(row, 'group_id'),
    sortOrder: readNonNegativeInteger(row, 'sort_order'),
  };
}

function readProductType(row: DatabaseRow): CatalogProductType {
  const value = readString(row, 'type');
  if (!productTypes.some((type) => type === value)) throw new Error('Invalid PostgreSQL row field: type');
  return value as CatalogProductType;
}

function readProductSize(row: DatabaseRow): CatalogProductSize {
  const value = readString(row, 'size');
  if (!productSizes.some((size) => size === value)) throw new Error('Invalid PostgreSQL row field: size');
  return value as CatalogProductSize;
}

function readModifierSelectionType(row: DatabaseRow): CatalogModifierSelectionType {
  const value = readString(row, 'selection_type');
  if (!modifierSelectionTypes.some((type) => type === value)) throw new Error('Invalid PostgreSQL row field: selection_type');
  return value as CatalogModifierSelectionType;
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

function readInteger(row: DatabaseRow, key: string): number {
  const value = row[key];
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error('Invalid PostgreSQL row field: ' + key);
  return value;
}

function readNonNegativeInteger(row: DatabaseRow, key: string): number {
  const value = readInteger(row, key);
  if (value < 0) throw new Error('Invalid PostgreSQL row field: ' + key);
  return value;
}

function readNullableInteger(row: DatabaseRow, key: string): number | null {
  const value = row[key];
  return value === null ? null : readInteger(row, key);
}

function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new Error('Invalid PostgreSQL row field: ' + key);
  return value;
}
