import type { PublicMenuProduct } from "@/shared/api/public-menu.api";
export interface ProductCardProps {
  product: PublicMenuProduct;
}
export interface ProductCardEmits {
  select: [productId: string];
}
