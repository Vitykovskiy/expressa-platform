export const cartPageRoute = {
  authPhone: "/auth/phone",
  cart: "/cart",
  menu: "/",
  orders: "/orders",
} as const;

export const cartPageMessages = {
  invalidReconfirmedTotal:
    "Для повторного подтверждения требуется новый итог заказа.",
  intakeClosed: "Приём новых заказов сейчас закрыт.",
} as const;
