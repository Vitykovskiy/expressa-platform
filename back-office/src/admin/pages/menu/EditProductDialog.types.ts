import type {
  EditMenuProductData,
  MenuItem,
} from "../../shared/ui/Admin.types";

export interface ProductSizeDraft {
  id: string;
  size: string;
  price: number;
}

export interface EditProductDialogProps {
  product: MenuItem | null;
  categories: readonly string[];
}

export interface EditProductDialogEmits {
  save: [data: EditMenuProductData];
  delete: [];
  cancel: [];
}
