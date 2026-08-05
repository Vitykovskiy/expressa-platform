import type { AdminProduct, ProductDetails } from '../domain/product-admin.policy.types';

export type ProductAuditAction = 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_REORDERED' | 'PRODUCT_ARCHIVED';
export type ProductAuditEvent = { actorId: string; requestId: string; action: ProductAuditAction; productId: string; before: AdminProduct | null; after: AdminProduct | null };
export interface ProductsRepository {
  categoryExists(id: string): Promise<boolean>;
  findById(id: string): Promise<AdminProduct | null>;
  findCurrentByCategory(categoryId: string): Promise<AdminProduct[]>;
  create(details: ProductDetails): Promise<AdminProduct>;
  update(id: string, details: ProductDetails): Promise<AdminProduct>;
  reorder(products: readonly AdminProduct[], productIds: readonly string[]): Promise<AdminProduct[]>;
  archive(id: string): Promise<AdminProduct>;
  writeAudit(event: ProductAuditEvent): Promise<void>;
}
export interface ProductsUnitOfWork { run<Result>(command: (repository: ProductsRepository) => Promise<Result>, audit: (repository: ProductsRepository, result: Result) => Promise<void>): Promise<Result>; }
export type CreateProductCommand = ProductDetails & { actorId: string; requestId: string };
export type UpdateProductCommand = ProductDetails & { actorId: string; requestId: string; productId: string };
export type ReorderProductsCommand = { actorId: string; requestId: string; categoryId: string; productIds: string[] };
export type ArchiveProductCommand = { actorId: string; requestId: string; productId: string };
