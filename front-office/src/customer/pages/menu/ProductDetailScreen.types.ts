import type {
  CartItem,
  CartItemDraft,
  Category,
  Product,
} from "../../shared/model/customer.types";

export type { CartItemDraft } from "../../shared/model/customer.types";

export interface ProductDetailScreenProps {
  category: Category;
  product: Product;
  cartItem?: CartItem;
}
export type ProductDetailScreenEmits = {
  submit: [item: CartItemDraft, editId?: string];
};
