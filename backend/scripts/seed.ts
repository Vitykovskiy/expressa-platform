import { Pool, type PoolClient } from "pg";
import { validateEnvironment } from "../src/platform/config/environment";
import {
  catalogSeed,
  customerMenuCatalogSeed,
  developmentCatalogOwnedIds,
  categoryModifierGroupUpsertSql,
  categoryUpsertSql,
  modifierGroupUpsertSql,
  modifierOptionUpsertSql,
  productUpsertSql,
  productModifierGroupUpsertSql,
  productPriceChoiceUpsertSql,
  productVariantUpsertSql,
} from "./seed.constants";

async function seedCatalog(
  pool: Pool | PoolClient,
  seed = catalogSeed,
): Promise<void> {
  for (const category of seed.categories) {
    await pool.query(categoryUpsertSql, [
      category.id,
      category.name,
      category.description,
      category.sortOrder,
      category.isActive,
    ]);
  }

  for (const modifierGroup of seed.modifierGroups) {
    await pool.query(modifierGroupUpsertSql, [
      modifierGroup.id,
      modifierGroup.name,
      modifierGroup.selectionType,
      modifierGroup.minSelect,
      modifierGroup.maxSelect,
      modifierGroup.isActive,
    ]);
  }

  for (const product of seed.products) {
    await pool.query(productUpsertSql, [
      product.id,
      product.categoryId,
      product.type,
      product.name,
      product.description,
      product.displayLabel ?? null,
      product.price,
      product.sortOrder,
      product.isActive,
      product.isAvailable,
    ]);
  }

  for (const productVariant of seed.productVariants) {
    await pool.query(productVariantUpsertSql, [
      productVariant.id,
      productVariant.productId,
      productVariant.size,
      productVariant.displayLabel ?? null,
      productVariant.price,
      productVariant.sortOrder,
      productVariant.isAvailable,
    ]);
  }

  for (const priceChoice of seed.productPriceChoices) {
    await pool.query(productPriceChoiceUpsertSql, [
      priceChoice.id,
      priceChoice.productId,
      priceChoice.portionLabel,
      priceChoice.price,
      priceChoice.sortOrder,
      priceChoice.isAvailable,
    ]);
  }

  for (const modifierOption of seed.modifierOptions) {
    await pool.query(modifierOptionUpsertSql, [
      modifierOption.id,
      modifierOption.groupId,
      modifierOption.name,
      modifierOption.priceDelta,
      modifierOption.sortOrder,
      modifierOption.isDefault,
      modifierOption.isAvailable,
    ]);
  }

  for (const categoryModifierGroup of seed.categoryModifierGroups) {
    await pool.query(categoryModifierGroupUpsertSql, [
      categoryModifierGroup.categoryId,
      categoryModifierGroup.groupId,
      categoryModifierGroup.sortOrder,
    ]);
  }
  for (const assignment of seed.productModifierGroups) {
    await pool.query(productModifierGroupUpsertSql, [
      assignment.productId,
      assignment.groupId,
      assignment.sortOrder,
    ]);
  }
}

async function seedDevelopmentCustomerMenu(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [7_249_001]);
    await client.query(
      "DELETE FROM product_modifier_groups WHERE product_id = ANY($1::uuid[]) OR group_id = ANY($2::uuid[])",
      [developmentCatalogOwnedIds.products, developmentCatalogOwnedIds.groups],
    );
    await client.query(
      "DELETE FROM category_modifier_groups WHERE category_id = ANY($1::uuid[]) OR group_id = ANY($2::uuid[])",
      [
        developmentCatalogOwnedIds.categories,
        developmentCatalogOwnedIds.groups,
      ],
    );
    await client.query(
      "UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.variants],
    );
    await client.query(
      "UPDATE product_price_choices SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.priceChoices],
    );
    await client.query(
      "UPDATE modifier_options SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.options],
    );
    await client.query(
      "UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.products],
    );
    await client.query(
      "UPDATE modifier_groups SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.groups],
    );
    await client.query(
      "UPDATE categories SET archived_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])",
      [developmentCatalogOwnedIds.categories],
    );
    const categoryOffset = await readSortOffset(client, "categories", []);
    const productOffsets = new Map<string, number>();
    for (const category of customerMenuCatalogSeed.categories) {
      productOffsets.set(
        category.id,
        await readSortOffset(client, "products", [category.id]),
      );
    }
    await seedCatalog(client, {
      ...customerMenuCatalogSeed,
      categories: customerMenuCatalogSeed.categories.map((category) => ({
        ...category,
        sortOrder: categoryOffset + category.sortOrder,
      })),
      products: customerMenuCatalogSeed.products.map((product) => ({
        ...product,
        sortOrder:
          (productOffsets.get(product.categoryId) ?? 0) + product.sortOrder,
      })),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function readSortOffset(
  client: PoolClient,
  table: "categories" | "products",
  categoryIds: readonly string[],
): Promise<number> {
  const result = await client.query<{ max: number | null }>(
    table === "categories"
      ? "SELECT MAX(sort_order) AS max FROM categories WHERE archived_at IS NULL"
      : "SELECT MAX(sort_order) AS max FROM products WHERE archived_at IS NULL AND category_id = $1",
    [...categoryIds],
  );
  const max = result.rows[0]?.max;
  if (max === null || max === undefined) return 0;
  if (!Number.isSafeInteger(max) || max >= 2_147_483_640) {
    throw new Error("Catalog sort order space is exhausted.");
  }
  return max + 1;
}

async function main(): Promise<void> {
  validateEnvironment(process.env);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool
      .query(
        `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name = ANY($1::text[])`,
        [
          [
            "users",
            "categories",
            "products",
            "product_price_choices",
            "orders",
          ],
        ],
      )
      .then((result) => {
        if (result.rowCount !== 5) {
          throw new Error("Database schema is not initialized.");
        }
      });
    const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
    if (phone !== undefined && phone !== "") {
      await pool.query(
        `INSERT INTO users (phone_e164, role) VALUES ($1, 'administrator')
         ON CONFLICT (phone_e164) DO UPDATE
         SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
        [phone],
      );
    }

    if (process.env.NODE_ENV === "development") {
      await seedDevelopmentCustomerMenu(pool);
    } else {
      await seedCatalog(pool);
    }
  } finally {
    await pool.end();
  }
}

void main();
