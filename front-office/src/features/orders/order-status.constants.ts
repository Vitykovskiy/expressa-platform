export const datedOrderNumberPattern = /^\d{8}-(\d{3})$/;

export const orderCreationDateFormat = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
} satisfies Intl.DateTimeFormatOptions;

export const orderPickupTimeFormat = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
} satisfies Intl.DateTimeFormatOptions;

export const orderStatusMessages = {
  rejected: "Заказ отклонён",
  pickupUnassigned: "Время получения не задано",
} as const;
