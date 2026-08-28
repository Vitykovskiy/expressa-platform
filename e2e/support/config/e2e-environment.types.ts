export interface E2eEnvironment {
  readonly frontOfficeUrl: string;
  readonly backOfficeUrl: string;
}

export interface E2eCredentials {
  readonly administrator: E2eOtpCredentials;
  readonly staff: E2eOtpCredentials;
  readonly customer: E2eOtpCredentials;
  readonly secondCustomer: E2eOtpCredentials;
}

export interface E2eOtpCredentials {
  readonly phone: string;
  readonly otp: string;
}
