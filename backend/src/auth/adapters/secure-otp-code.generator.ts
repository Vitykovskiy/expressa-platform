import { randomInt } from "node:crypto";
import type { OtpCodeGenerator } from "../application/otp-code-generator.types";
import { otpCodeUpperBound } from "./secure-otp-code.generator.constants";

export class SecureOtpCodeGenerator implements OtpCodeGenerator {
  generate(): string {
    return randomInt(otpCodeUpperBound).toString().padStart(6, "0");
  }
}
