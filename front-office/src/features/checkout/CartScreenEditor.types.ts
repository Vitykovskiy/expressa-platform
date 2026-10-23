import type {
  CartItem,
  ConfiguredCartItemDraft,
} from "@/entities/customer/model/customer.types";

export type CartScreenEditorProps = {
  item: CartItem;
};

export type CartScreenEditorEmits = {
  cancel: [];
  save: [draft: ConfiguredCartItemDraft];
};
