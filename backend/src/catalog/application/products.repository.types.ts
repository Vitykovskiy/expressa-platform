import type {
  AdminProduct,
  ProductDetails,
  V3AdminProduct,
  V3ProductDetails,
} from "../domain/product-admin.policy.types";

export type ProductAuditAction =
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_REORDERED"
  | "PRODUCT_ARCHIVED";
export type ProductAuditEvent = {
  actorId: string;
  requestId: string;
  action: ProductAuditAction;
  productId: string;
  before: AdminProduct | null;
  after: AdminProduct | null;
};
export interface ProductsRepository {
  categoryExists(id: string): Promise<boolean>;
  findById(id: string): Promise<AdminProduct | null>;
  findCurrentByCategory(categoryId: string): Promise<AdminProduct[]>;
  create(details: ProductDetails): Promise<AdminProduct>;
  update(id: string, details: ProductDetails): Promise<AdminProduct>;
  reorder(
    products: readonly AdminProduct[],
    productIds: readonly string[],
  ): Promise<AdminProduct[]>;
  archive(id: string): Promise<AdminProduct>;
  writeAudit(event: ProductAuditEvent): Promise<void>;
}
export interface V3ProductsRepository {
  categoryExists(id: string): Promise<boolean>;
  findV3ById(id: string): Promise<V3AdminProduct | null>;
  findCurrentV3ByCategory(categoryId: string): Promise<V3AdminProduct[]>;
  createV3(details: V3ProductDetails): Promise<V3AdminProduct>;
  updateV3(id: string, details: V3ProductDetails): Promise<V3AdminProduct>;
  reorderV3(
    products: readonly V3AdminProduct[],
    productIds: readonly string[],
  ): Promise<V3AdminProduct[]>;
  archiveV3(id: string): Promise<V3AdminProduct>;
  writeV3Audit(event: V3ProductAuditEvent): Promise<void>;
}
export interface V3ProductsUnitOfWork {
  runV3<Result>(
    command: (repository: V3ProductsRepository) => Promise<Result>,
    audit: (repository: V3ProductsRepository, result: Result) => Promise<void>,
  ): Promise<Result>;
}
export interface ProductsUnitOfWork {
  run<Result>(
    command: (repository: ProductsRepository) => Promise<Result>,
    audit: (repository: ProductsRepository, result: Result) => Promise<void>,
  ): Promise<Result>;
}
export type CreateProductCommand = ProductDetails & {
  actorId: string;
  requestId: string;
};
export type UpdateProductCommand = ProductDetails & {
  actorId: string;
  requestId: string;
  productId: string;
};
export type ReorderProductsCommand = {
  actorId: string;
  requestId: string;
  categoryId: string;
  productIds: string[];
};
export type ArchiveProductCommand = {
  actorId: string;
  requestId: string;
  productId: string;
};
export type V3ProductCommand = V3ProductDetails & {
  actorId: string;
  requestId: string;
};
export type V3ReorderProductsCommand = {
  actorId: string;
  requestId: string;
  categoryId: string;
  productIds: string[];
};
export type V3ArchiveProductCommand = {
  actorId: string;
  requestId: string;
  productId: string;
};
export type V3ProductAuditEvent = {
  actorId: string;
  requestId: string;
  action: ProductAuditAction;
  productId: string;
  before: V3AdminProduct | null;
  after: V3AdminProduct | null;
};
