import { SecureOtpCodeGenerator } from './secure-otp-code.generator';

describe('SecureOtpCodeGenerator', () => {
  it('выдаёт шестизначный числовой код', () => {
    const generator = new SecureOtpCodeGenerator();

    for (let index = 0; index < 100; index += 1) {
      expect(generator.generate()).toMatch(/^\d{6}$/);
    }
  });
});
