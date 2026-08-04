import type { DeliveryEnvironment } from '../platform/config/environment.types';

export type AuthModuleConfiguration = {
  allowedOrigins: readonly string[];
  developmentOtp: string | undefined;
  environment: DeliveryEnvironment;
  jwtSecret: string;
  otpPepper: string;
  smsRuApiId: string | undefined;
  smsRuSender: string | undefined;
};
