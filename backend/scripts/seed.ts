import { Pool } from 'pg';
import { validateEnvironment } from '../src/platform/config/environment';
import {
  catalogSeed,
  categoryModifierGroupUpsertSql,
  categoryUpsertSql,
  modifierGroupUpsertSql,
  modifierOptionUpsertSql,
  productUpsertSql,
  productVariantUpsertSql,
} from './seed.constants';

async function seedCatalog(pool: Pool): Promise<void> {
  for (const category of catalogSeed.categories) {
    await pool.query(categoryUpsertSql, [
      category.id,
      category.name,
      category.description,
      category.sortOrder,
      category.isActive,
    ]);
  }

  for (const modifierGroup of catalogSeed.modifierGroups) {
    await pool.query(modifierGroupUpsertSql, [
      modifierGroup.id,
      modifierGroup.name,
      modifierGroup.selectionType,
      modifierGroup.minSelect,
      modifierGroup.maxSelect,
      modifierGroup.isActive,
    ]);
  }

  for (const product of catalogSeed.products) {
    await pool.query(productUpsertSql, [
      product.id,
      product.categoryId,
      product.type,
      product.name,
      product.description,
      product.priceMinor,
      product.sortOrder,
      product.isActive,
      product.isAvailable,
    ]);
  }

  for (const productVariant of catalogSeed.productVariants) {
    await pool.query(productVariantUpsertSql, [
      productVariant.id,
      productVariant.productId,
      productVariant.size,
      productVariant.priceMinor,
      productVariant.sortOrder,
      productVariant.isAvailable,
    ]);
  }

  for (const modifierOption of catalogSeed.modifierOptions) {
    await pool.query(modifierOptionUpsertSql, [
      modifierOption.id,
      modifierOption.groupId,
      modifierOption.name,
      modifierOption.priceDeltaMinor,
      modifierOption.sortOrder,
      modifierOption.isDefault,
      modifierOption.isAvailable,
    ]);
  }

  for (const categoryModifierGroup of catalogSeed.categoryModifierGroups) {
    await pool.query(categoryModifierGroupUpsertSql, [
      categoryModifierGroup.categoryId,
      categoryModifierGroup.groupId,
      categoryModifierGroup.sortOrder,
    ]);
  }
}

async function main(): Promise<void> {
  validateEnvironment(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
    const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
    if (phone !== undefined && phone !== '') {
      await pool.query(
        `INSERT INTO users (phone_e164, role) VALUES ($1, 'administrator')
         ON CONFLICT (phone_e164) DO UPDATE
         SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
        [phone],
      );
    }

    await seedCatalog(pool);
  } finally {
    await pool.end();
  }
}

void main();
