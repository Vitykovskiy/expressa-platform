import { moneyFormatOptions, minorUnitsPerRuble } from "./money.constants";
import type { MinorAmount } from "./money.types";
const formatter = new Intl.NumberFormat("ru-RU", moneyFormatOptions);
export function formatMinorAmount(value: MinorAmount): string {
  return formatter.format(value / minorUnitsPerRuble);
}
