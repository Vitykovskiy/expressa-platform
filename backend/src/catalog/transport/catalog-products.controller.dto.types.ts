import type { CatalogProductSize, CatalogProductType } from '../domain/catalog.types';
export type ProductVariantDto = { id: string; size: CatalogProductSize; price: number; sortOrder: number; isAvailable: boolean };
export type ProductDto = { id: string; categoryId: string; type: CatalogProductType; name: string; description: string; price: number | null; sortOrder: number; isActive: boolean; isAvailable: boolean; variants: ProductVariantDto[] };
export type ProductRequestContext = { requestId?: string };
