import { loginPhoneDigitsLength } from "../../LoginPage.constants";

export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === loginPhoneDigitsLength - 1 && !value.startsWith("+"))
    digits = `7${digits}`;
  else if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith("7")) digits = `7${digits}`;
  digits = digits.slice(0, loginPhoneDigitsLength);

  let formatted = "+7";
  if (digits.length > 1) formatted += ` ${digits.slice(1, 4)}`;
  if (digits.length > 4) formatted += ` ${digits.slice(4, 7)}`;
  if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
  if (digits.length > 9) formatted += `-${digits.slice(9)}`;
  return formatted;
}
