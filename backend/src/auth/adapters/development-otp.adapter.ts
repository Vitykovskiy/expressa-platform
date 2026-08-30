import type { OtpCodeGenerator } from "../application/otp-code-generator.types";
import type { SmsSender } from "../application/sms-sender.types";
import {
  developmentEnvironments,
  otpCodePattern,
} from "./development-otp.adapter.constants";
import type { DevelopmentEnvironment } from "./development-otp.adapter.types";
import type { RussianPhone } from "../domain/phone.types";

export class DevelopmentOtpAdapter implements OtpCodeGenerator, SmsSender {
  private readonly code: string;

  constructor(environment: string, code: string | undefined) {
    if (!isDevelopmentEnvironment(environment)) {
      throw new Error(
        "Development OTP adapter is unavailable in this environment.",
      );
    }

    if (code === undefined || !otpCodePattern.test(code)) {
      throw new Error("Invalid environment variable: AUTH_DEVELOPMENT_OTP");
    }

    this.code = code;
  }

  generate(): string {
    return this.code;
  }

  async send(phone: RussianPhone, code: string): Promise<void> {
    void phone;
    void code;
  }
}

function isDevelopmentEnvironment(
  value: string,
): value is DevelopmentEnvironment {
  return developmentEnvironments.some((environment) => environment === value);
}
