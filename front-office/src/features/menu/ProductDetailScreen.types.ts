import type {
  PublicMenuCategory,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";
import type {
  ConfiguredCartItemDraft,
  OtherCartItem,
  PricedCartItem,
} from "@/entities/customer/model/customer.types";

export interface ProductDetailScreenProps {
  category: PublicMenuCategory;
  product: PublicMenuProduct;
  cartItem?: PricedCartItem | OtherCartItem;
}
export type ProductDetailScreenEmits = {
  back: [];
  submit: [item: ConfiguredCartItemDraft, editId?: string];
};
