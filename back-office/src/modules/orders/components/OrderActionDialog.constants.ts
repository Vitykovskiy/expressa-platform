import type {
  OrderActionDialogCopy,
  OrderActionDialogProps,
} from "./OrderActionDialog.types";

export const ORDER_DIALOG_COPY = {
  reject: {
    title: "Отклонить заказ",
    description: "Укажите причину отклонения заказа",
    action: "Отклонить",
  },
  issue: {
    title: "Выдать заказ",
    description:
      "Убедитесь, что заказ оплачен на кассе, и передайте его клиенту.",
    action: "Выдать заказ",
  },
} as const satisfies Readonly<
  Record<NonNullable<OrderActionDialogProps["mode"]>, OrderActionDialogCopy>
>;
