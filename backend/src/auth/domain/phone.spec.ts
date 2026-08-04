import { InvalidPhoneError } from './auth.errors';
import { normalizeRussianPhone } from './phone';

describe('normalizeRussianPhone', () => {
  it.each([
    ['+7 (912) 345-67-89', '+79123456789'],
    ['8 912 345 67 89', '+79123456789'],
    ['7-912-345-67-89', '+79123456789'],
    ['912.345.67.89', '+79123456789'],
  ])('нормализует распространённый российский ввод %s', (input, expected) => {
    expect(normalizeRussianPhone(input)).toBe(expected);
  });

  it.each([
    '+1 202 555 0100',
    '+375 29 123-45-67',
    '+7 912 345-67-8',
    '1234567890',
    '91234567890',
    'телефон +7 912 345-67-89',
  ])('отклоняет иностранный, неполный или неоднозначный номер %s', (input) => {
    expect(() => normalizeRussianPhone(input)).toThrow(InvalidPhoneError);
  });
});
