import type { PoolClient } from "pg";
import type {
  ProductAuditEvent,
  ProductsRepository,
  ProductsUnitOfWork,
} from "../application/products.repository.types";
import type {
  AdminProduct,
  AdminProductVariant,
  ProductDetails,
} from "../domain/product-admin.policy.types";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import type { DatabaseRow } from "./postgres-products.repository.types";

export class PostgresProductsRepository implements ProductsUnitOfWork {
  constructor(private readonly runner: PostgresCatalogCommandRunner) {}
  async run<Result>(
    command: (repository: ProductsRepository) => Promise<Result>,
    audit: (repository: ProductsRepository, result: Result) => Promise<void>,
  ): Promise<Result> {
    return this.runner.run(
      (client) => command(new PostgresProductsTransactionRepository(client)),
      (client, result) =>
        audit(new PostgresProductsTransactionRepository(client), result),
    );
  }
}

class PostgresProductsTransactionRepository implements ProductsRepository {
  constructor(private readonly client: PoolClient) {}
  async categoryExists(id: string): Promise<boolean> {
    return (
      (
        await this.client.query(
          "SELECT 1 FROM categories WHERE id = $1 AND archived_at IS NULL",
          [id],
        )
      ).rows.length === 1
    );
  }
  async findById(id: string): Promise<AdminProduct | null> {
    const product = await this.findProducts("WHERE id = $1", [id]);
    return product[0] ?? null;
  }
  async findCurrentByCategory(categoryId: string): Promise<AdminProduct[]> {
    return this.findProducts("WHERE category_id = $1 AND archived_at IS NULL", [
      categoryId,
    ]);
  }
  async create(details: ProductDetails): Promise<AdminProduct> {
    const result = await this.client.query<DatabaseRow>(
      `INSERT INTO products (category_id, type, name, description, price_minor, sort_order, is_active, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        details.categoryId,
        details.type,
        details.name,
        details.description,
        details.priceMinor,
        details.sortOrder,
        details.isActive,
        details.isAvailable,
      ],
    );
    const id = requiredId(result.rows[0]);
    await this.insertVariants(id, details.variants);
    return requiredProduct(await this.findById(id));
  }
  async update(id: string, details: ProductDetails): Promise<AdminProduct> {
    await this.client.query(
      `UPDATE products SET category_id = $2, type = $3, name = $4, description = $5, price_minor = $6, sort_order = $7, is_active = $8, is_available = $9
      WHERE id = $1 AND archived_at IS NULL`,
      [
        id,
        details.categoryId,
        details.type,
        details.name,
        details.description,
        details.priceMinor,
        details.sortOrder,
        details.isActive,
        details.isAvailable,
      ],
    );
    await this.syncVariants(id, details.variants);
    return requiredProduct(await this.findById(id));
  }
  async reorder(
    products: readonly AdminProduct[],
    productIds: readonly string[],
  ): Promise<AdminProduct[]> {
    const activeIds = products
      .filter((product) => product.isActive)
      .map((product) => product.id);
    await this.client.query(
      "UPDATE products SET is_active = false WHERE id = ANY($1::uuid[]) AND archived_at IS NULL",
      [activeIds],
    );
    await this.client.query(
      `UPDATE products AS product SET sort_order = ordered.sort_order - 1
      FROM unnest($1::uuid[]) WITH ORDINALITY AS ordered(id, sort_order) WHERE product.id = ordered.id`,
      [productIds],
    );
    await this.client.query(
      "UPDATE products SET is_active = true WHERE id = ANY($1::uuid[]) AND archived_at IS NULL",
      [activeIds],
    );
    return this.findProducts("WHERE id = ANY($1::uuid[])", [productIds]);
  }
  async archive(id: string): Promise<AdminProduct> {
    await this.client.query(
      "UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE product_id = $1 AND archived_at IS NULL",
      [id],
    );
    const result = await this.client.query<DatabaseRow>(
      "UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = $1 AND archived_at IS NULL RETURNING id",
      [id],
    );
    return requiredProduct(await this.findById(requiredId(result.rows[0])));
  }
  async writeAudit(event: ProductAuditEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, before_state, after_state, request_id)
      VALUES ($1, 'product', $2, $3, $4::jsonb, $5::jsonb, $6)`,
      [
        event.actorId,
        event.productId,
        event.action,
        JSON.stringify(event.before),
        JSON.stringify(event.after),
        event.requestId,
      ],
    );
  }
  private async insertVariants(
    productId: string,
    variants: ProductDetails["variants"],
  ): Promise<void> {
    for (const variant of variants)
      await this.client.query(
        `INSERT INTO product_variants (product_id, size, price_minor, sort_order, is_available)
      VALUES ($1, $2, $3, $4, $5)`,
        [
          productId,
          variant.size,
          variant.priceMinor,
          variant.sortOrder,
          variant.isAvailable,
        ],
      );
  }
  private async syncVariants(
    productId: string,
    variants: ProductDetails["variants"],
  ): Promise<void> {
    const currentVariants = (await this.findById(productId))?.variants.filter(
      (variant) => variant.archivedAt === null,
    );
    if (currentVariants === undefined)
      throw new Error("Product command returned no row");
    const currentVariantIdsBySize = new Map(
      currentVariants.map((variant) => [variant.size, variant.id]),
    );
    await this.client.query(
      "UPDATE product_variants SET archived_at = CURRENT_TIMESTAMP WHERE product_id = $1 AND archived_at IS NULL",
      [productId],
    );
    for (const variant of variants) {
      const currentVariantId = currentVariantIdsBySize.get(variant.size);
      if (currentVariantId === undefined) {
        await this.insertVariants(productId, [variant]);
        continue;
      }
      await this.client.query(
        `UPDATE product_variants
        SET size = $2, price_minor = $3, sort_order = $4, is_available = $5, archived_at = NULL
        WHERE id = $1`,
        [
          currentVariantId,
          variant.size,
          variant.priceMinor,
          variant.sortOrder,
          variant.isAvailable,
        ],
      );
    }
  }
  private async findProducts(
    where: string,
    values: unknown[],
  ): Promise<AdminProduct[]> {
    const products = await this.client.query<DatabaseRow>(
      `SELECT id, category_id, type, name, description, price_minor, sort_order, is_active, is_available, archived_at FROM products ${where} ORDER BY sort_order, id`,
      values,
    );
    if (products.rows.length === 0) return [];
    const variants = await this.client.query<DatabaseRow>(
      "SELECT id, product_id, size, price_minor, sort_order, is_available, archived_at FROM product_variants WHERE product_id = ANY($1::uuid[]) ORDER BY sort_order, id",
      [products.rows.map((row) => readString(row, "id"))],
    );
    return products.rows.map((row) =>
      parseProduct(
        row,
        variants.rows.filter(
          (variant) =>
            readString(variant, "product_id") === readString(row, "id"),
        ),
      ),
    );
  }
}

function requiredId(row: DatabaseRow | undefined): string {
  if (row === undefined) throw new Error("Product command returned no row");
  return readString(row, "id");
}
function requiredProduct(value: AdminProduct | null): AdminProduct {
  if (value === null) throw new Error("Product command returned no row");
  return value;
}
function parseProduct(row: DatabaseRow, variants: DatabaseRow[]): AdminProduct {
  const type = readProductType(row, "type");
  const priceMinor = readNullableInteger(row, "price_minor");
  return {
    id: readString(row, "id"),
    categoryId: readString(row, "category_id"),
    type,
    name: readString(row, "name"),
    description: readString(row, "description"),
    priceMinor,
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isActive: readBoolean(row, "is_active"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
    variants: variants.map(parseVariant),
  };
}
function parseVariant(row: DatabaseRow): AdminProductVariant {
  return {
    id: readString(row, "id"),
    productId: readString(row, "product_id"),
    size: readProductSize(row, "size"),
    priceMinor: readNonNegativeInteger(row, "price_minor"),
    sortOrder: readNonNegativeInteger(row, "sort_order"),
    isAvailable: readBoolean(row, "is_available"),
    archivedAt: readNullableDate(row, "archived_at"),
  };
}
function readProductType(row: DatabaseRow, key: string): "DRINK" | "OTHER" {
  const value = readString(row, key);
  if (value !== "DRINK" && value !== "OTHER")
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}
function readProductSize(row: DatabaseRow, key: string): "S" | "M" | "L" {
  const value = readString(row, key);
  if (value !== "S" && value !== "M" && value !== "L")
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
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
function readNullableInteger(row: DatabaseRow, key: string): number | null {
  const value = row[key];
  return value === null ? null : readInteger(row, key);
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
function readNullableDate(row: DatabaseRow, key: string): Date | null {
  const value = row[key];
  if (value === null) return null;
  if (!(value instanceof Date) || Number.isNaN(value.getTime()))
    throw new Error("Invalid PostgreSQL row field: " + key);
  return value;
}
