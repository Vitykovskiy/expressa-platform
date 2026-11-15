import type {
  RepeatResult,
  RepeatWarning,
} from "@/entities/customer/model/cart.store.types";
import type { CartItem } from "@/entities/customer/model/customer.types";

export type CartIntakeRecovery = {
  status: "idle" | "pending" | "failed";
  /** Последний подтверждённый отказ сохраняется до успешного свежего чтения. */
  confirmedClosed: boolean;
};

type CartScreenBaseProps = {
  intakeRecovery?: CartIntakeRecovery;
  /** Позиция списка в CSS px перед открытием редактора; браузер ограничивает высотой списка. */
  listScrollTop?: number;
  acceptsNewOrders?: boolean;
  itemsLocked?: boolean;
  requiresPhoneConfirmation?: boolean;
  items: CartItem[];
  errorMessage?: string | null;
  repeatWarnings?: RepeatWarning[];
  repeatResult?: RepeatResult | null;
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
  editItem: [itemId: string, listScrollTop: number];
  removeItem: [itemId: string];
  updateQuantity: [itemId: string, nextQuantity: number];
  continueShopping: [];
  checkout: [];
  reconfirm: [];
  recheckAvailability: [];
};
