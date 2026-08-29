export const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  currency: "RUB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

export const orderHeadingPattern = /^Заказ №\d{8}-\d{3}$/u;

export const orderIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
