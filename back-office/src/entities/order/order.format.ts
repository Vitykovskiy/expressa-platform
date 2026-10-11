import { orderDateFormatter, rubleFormatter } from "./order.format.constants";

export function formatRubles(value: number) {
  return rubleFormatter.format(value);
}

export function formatOrderDate(value: string) {
  return orderDateFormatter.format(new Date(value));
}
