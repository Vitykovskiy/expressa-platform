import type { CatalogProductSize, CatalogProductType } from './catalog.types';
import type { productAdminErrorCodes } from './product-admin.policy.constants';

export type ProductAdminErrorCode = (typeof productAdminErrorCodes)[number];

export type ProductVariantDetails = { size: CatalogProductSize; price: number; sortOrder: number; isAvailable: boolean };
export type AdminProductVariant = ProductVariantDetails & { id: string; productId: string; archivedAt: Date | null };
export type ProductDetails = {
  categoryId: string; type: CatalogProductType; name: string; description: string; price: number | null;
  sortOrder: number; isActive: boolean; isAvailable: boolean; variants: ProductVariantDetails[];
};
export type AdminProduct = Omit<ProductDetails, 'variants'> & { id: string; archivedAt: Date | null; variants: AdminProductVariant[] };
