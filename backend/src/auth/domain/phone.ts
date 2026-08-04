import { InvalidPhoneError } from './auth.errors';
import { allowedPhoneCharacters, russianNationalNumber } from './phone.constants';
import type { RussianPhone } from './phone.types';

export function normalizeRussianPhone(value: string): RussianPhone {
  const input = value.trim();

  if (!allowedPhoneCharacters.test(input)) {
    throw new InvalidPhoneError();
  }

  const digits = input.replace(/\D/g, '');
  const nationalNumber = getRussianNationalNumber(input, digits);

  if (nationalNumber === null) {
    throw new InvalidPhoneError();
  }

  return `+7${nationalNumber}`;
}

function getRussianNationalNumber(
  input: string,
  digits: string,
): string | null {
  if (input.startsWith('+')) {
    return /^7\d{10}$/.test(digits) ? digits.slice(1) : null;
  }

  if (/^[78]\d{10}$/.test(digits)) {
    return digits.slice(1);
  }

  return russianNationalNumber.test(digits) ? digits : null;
}
