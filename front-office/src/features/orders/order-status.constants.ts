export const orderPickupDateFormat = {
  day: "numeric",
  month: "long",
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
