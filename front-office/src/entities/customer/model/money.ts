import { moneyFormatOptions } from "./money.constants";
import type { RubleAmount } from "./money.types";
const formatter = new Intl.NumberFormat("ru-RU", moneyFormatOptions);
export function formatRubles(value: RubleAmount): string {
  return formatter.format(value);
}
