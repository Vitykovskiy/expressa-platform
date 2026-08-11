import type { Category, Product } from "./catalog.types";
import type {
  ProductFormData,
  ProductFormField,
} from "./AddProductDialog.types";

export interface EditProductDialogProps {
  disabled: boolean;
  product: Product | null;
  categories: readonly Category[];
  fieldErrors?: Partial<Record<ProductFormField, string>>;
}

export interface EditProductDialogEmits {
  save: [data: ProductFormData];
  delete: [];
  cancel: [];
}
