import type { DeliveryEnvironment } from "../platform/config/environment.types";

export type AuthModuleConfiguration = {
  allowedOrigins: readonly string[];
  developmentOtp: string | undefined;
  environment: DeliveryEnvironment;
  jwtSecret: string;
  otpPepper: string;
  otpMode: string | undefined;
  smsRuApiId: string | undefined;
  smsRuSender: string | undefined;
  stagingTestOtpCode: string | undefined;
  stagingTestPhoneAllowlist: string | undefined;
};
