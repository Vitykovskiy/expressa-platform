import type {
  PublicMenuCategory,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import type {
  ConfiguredCartItemDraft,
  DrinkCartItem,
  OtherCartItem,
} from "@/entities/customer/model/customer.types";

export interface ProductDetailScreenProps {
  category: PublicMenuCategory;
  product: PublicMenuProduct;
  cartItem?: DrinkCartItem | OtherCartItem;
}
export type ProductDetailScreenEmits = {
  submit: [item: ConfiguredCartItemDraft, editId?: string];
};
