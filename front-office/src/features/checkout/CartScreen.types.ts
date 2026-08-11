import type { CartItem } from "@/entities/customer/model/customer.types";

type CartScreenBaseProps = {
  acceptsNewOrders?: boolean;
  items: CartItem[];
  errorMessage?: string | null;
  unavailableItemIds?: string[];
};

type CartScreenReconfirmationProps = CartScreenBaseProps & {
  checkoutState: "reconfirmation-required";
  reconfirmedTotalRub: number;
};

type CartScreenRegularProps = CartScreenBaseProps & {
  checkoutState?: Exclude<CartScreenCheckoutState, "reconfirmation-required">;
  reconfirmedTotalRub?: never;
};

export type CartScreenProps =
  CartScreenReconfirmationProps | CartScreenRegularProps;

export type CartScreenCheckoutState =
  "idle" | "submitting" | "reconfirmation-required" | "succeeded" | "error";

export type CartScreenEmits = {
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
  continueShopping: [];
  checkout: [];
  reconfirm: [];
};
