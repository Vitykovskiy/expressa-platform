import type { CreateMenuProductData } from "../../shared/ui/Admin.types";

export interface ProductSizeDraft {
  id: string;
  size: string;
  price: string;
}
export interface AddProductDialogProps {
  categories: readonly string[];
}
export interface AddProductDialogEmits {
  confirm: [data: CreateMenuProductData];
  cancel: [];
}
