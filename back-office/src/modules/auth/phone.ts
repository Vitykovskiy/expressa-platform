import {
  PHONE_CHARACTERS,
  PHONE_INTERNATIONAL_PATTERN,
  PHONE_NATIONAL_PATTERN,
  PHONE_PREFIXED_PATTERN,
} from "./phone.constants";

export function normalizePhone(value: string): string | null {
  const input = value.trim();

  if (!PHONE_CHARACTERS.test(input)) {
    return null;
  }

  const digits = input.replace(/\D/g, "");

  if (input.startsWith("+")) {
    if (!PHONE_INTERNATIONAL_PATTERN.test(digits)) {
      return null;
    }

    return `+${digits}`;
  }

  if (PHONE_PREFIXED_PATTERN.test(digits)) {
    return `+7${digits.slice(1)}`;
  }

  if (!PHONE_NATIONAL_PATTERN.test(digits)) {
    return null;
  }

  return `+7${digits}`;
}

// Форматирует полный или частичный номер +7; допустимость проверяет normalizePhone.
export function displayPhone(value: string): string {
  const digits = value.slice(2);
  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8),
  ];

  return groups.reduce((phone, group, index) => {
    if (group === "") {
      return phone;
    }

    return `${phone}${index < 2 ? " " : "-"}${group}`;
  }, "+7");
}

export function maskPhoneInput(value: string, caret: number) {
  let digits = value.replace(/\D/g, "");

  if (digits === "") {
    return { phone: "", caret: 0 };
  }

  const hasCountryPrefix = value.trim().startsWith("+7");
  const hasDialingPrefix =
    /^[78]/.test(digits) && (digits.length === 1 || digits.length > 10);

  if (hasCountryPrefix || hasDialingPrefix) {
    digits = digits.slice(1);
  }

  const phone = displayPhone(`+7${digits.slice(0, 10)}`);
  const digitsBeforeCaret = value.slice(0, caret).replace(/\D/g, "").length;
  const addedPrefixDigits = hasCountryPrefix || hasDialingPrefix ? 0 : 1;
  const targetDigits = Math.max(1, digitsBeforeCaret + addedPrefixDigits);
  let position = 0;
  let digitCount = 0;

  while (position < phone.length && digitCount < targetDigits) {
    if (/\d/.test(phone[position] ?? "")) {
      digitCount += 1;
    }

    position += 1;
  }

  return { phone, caret: position };
}
