import type {
  CatalogStoreError,
  Category,
  Product,
  CatalogFormSaveOutcome,
} from "./catalog.types";
import type {
  ProductFormData,
  ProductFormField,
} from "./AddProductDialog.types";

export interface EditProductDialogProps {
  disabled: boolean;
  product: Product | null;
  categories: readonly Category[];
  fieldErrors?: Partial<Record<ProductFormField, string>>;
  saveError?: CatalogStoreError | null;
  saveOutcome?: CatalogFormSaveOutcome;
}

export interface EditProductDialogEmits {
  save: [data: ProductFormData];
  delete: [];
  cancel: [];
  refresh: [];
}
