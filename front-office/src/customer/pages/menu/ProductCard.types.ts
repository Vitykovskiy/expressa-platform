import type { Product } from "../../shared/model/customer.types";
export interface ProductCardProps {
  product: Product;
  typeLabel: string;
}
export interface ProductCardEmits {
  select: [productId: string];
}
