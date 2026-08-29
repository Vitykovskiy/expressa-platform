export const developmentOtp = "123456";
export const staffRoles = ["barista", "administrator"] as const;
export const authApiPath = "/api/v2/auth/";
export const phonePrefix = "+7998";
export const otpRequestPath = "/auth/otp/request";
export const otpVerifyPath = "/auth/otp/verify";
export const refreshPath = "/auth/refresh";
export const authResponseTimeoutMessage =
  "Не получен ожидаемый ответ аутентификации.";
export const expectedUnauthorizedConsoleMessage =
  "Failed to load resource: the server responded with a status of 401 (Unauthorized)";
export const backendShutdownAttempts = 50;
export const backendShutdownDelayMilliseconds = 100;
export const databaseCleanupStatement = (phones: readonly string[]): string => {
  const quotedPhones = phones.map((phone) => `'${phone}'`).join(", ");

  return `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone_e164 IN (${quotedPhones})); DELETE FROM otp_challenges WHERE phone_e164 IN (${quotedPhones}); DELETE FROM users WHERE phone_e164 IN (${quotedPhones});`;
};
