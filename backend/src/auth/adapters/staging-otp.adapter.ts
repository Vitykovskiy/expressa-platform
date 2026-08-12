import type { OtpCodeGenerator } from '../application/otp-code-generator.types';
import type { SmsSender } from '../application/sms-sender.types';
import type { RussianPhone } from '../domain/phone.types';

export class StagingOtpAdapter implements OtpCodeGenerator, SmsSender {
  private readonly code: string;
  private readonly allowedPhones: ReadonlySet<RussianPhone>;

  constructor(
    environment: string,
    mode: string | undefined,
    code: string | undefined,
    allowlist: string | undefined,
  ) {
    if (environment !== 'staging' || mode !== 'staging_test') {
      throw new Error('Staging OTP adapter is unavailable in this environment.');
    }

    if (code === undefined || !/^\d{6}$/.test(code)) {
      throw new Error('Invalid environment variable: STAGING_TEST_OTP_CODE');
    }

    if (allowlist === undefined) {
      throw new Error('Invalid environment variable: STAGING_TEST_PHONE_ALLOWLIST');
    }

    const phones = allowlist.split(',');
    if (
      phones.some((phone) => !/^\+7\d{10}$/.test(phone)) ||
      new Set(phones).size !== phones.length
    ) {
      throw new Error('Invalid environment variable: STAGING_TEST_PHONE_ALLOWLIST');
    }

    this.code = code;
    this.allowedPhones = new Set(phones as RussianPhone[]);
  }

  generate(): string {
    return this.code;
  }

  async send(phone: RussianPhone, code: string): Promise<void> {
    void code;

    if (!this.allowedPhones.has(phone)) {
      throw new Error('Staging OTP delivery is unavailable for this phone.');
    }
  }
}
