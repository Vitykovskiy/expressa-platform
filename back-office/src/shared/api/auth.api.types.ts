export type AuthAccess = {
  accessToken: string;
  expiresInSeconds: number;
};

export type AuthAccessResponse = AuthAccess & {
  tokenType: "Bearer";
};

export type AuthCurrentUser = {
  id: string;
  phoneE164: string;
  role: AuthUserRole;
};

export type AuthOtpMetadata = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type AuthUserRole = "customer" | "barista" | "administrator";
