import {
  PHONE_CHARACTERS,
  PHONE_INTERNATIONAL_PATTERN,
  PHONE_NATIONAL_PATTERN,
  PHONE_PREFIXED_PATTERN,
} from "./auth.constants";

export function normalizePhone(value: string): string | null {
  const input = value.trim();

  if (!PHONE_CHARACTERS.test(input)) {
    return null;
  }

  const digits = input.replace(/\D/g, "");

  if (input.startsWith("+")) {
    return PHONE_INTERNATIONAL_PATTERN.test(digits) ? `+${digits}` : null;
  }

  if (PHONE_PREFIXED_PATTERN.test(digits)) {
    return `+7${digits.slice(1)}`;
  }

  return PHONE_NATIONAL_PATTERN.test(digits) ? `+7${digits}` : null;
}

export function displayPhone(value: string): string {
  const digits = value.slice(2);

  return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}
