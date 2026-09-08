import type { SessionState } from "./session.store.types";

export const sessionStatuses = {
  anonymous: "anonymous",
  authenticated: "authenticated",
  unknown: "unknown",
} as const;

export const sessionMessages = {
  dependenciesNotConfigured: "Зависимости сессии не настроены.",
  expiredOtpCode: "Срок действия кода истёк. Запросите новый код.",
  invalidOtpCode: "Одноразовый код недействителен.",
  otpRateLimited: "Повторный запрос кода пока недоступен.",
  operationFailed: "Не удалось выполнить операцию сессии.",
  requestOtp: "Не удалось отправить код. Попробуйте ещё раз.",
  restore: "Не удалось восстановить сессию. Попробуйте ещё раз.",
  roleRejected: "Эта учётная запись не является клиентской.",
  verifyOtp: "Не удалось подтвердить код. Попробуйте ещё раз.",
} as const;

export const sessionErrorCodes = {
  expiredOtpCode: "AUTH_CODE_EXPIRED",
  invalidOtpCode: "AUTH_CODE_INVALID",
  otpRateLimited: "AUTH_RATE_LIMITED",
} as const;

export const initialSessionState: SessionState = {
  accessToken: null,
  currentUser: null,
  errorMessage: null,
  otpExpiresAt: null,
  otpRequestMetadata: null,
  otpRequestedAt: null,
  pendingPhone: null,
  phone: null,
  restorePromise: null,
  status: sessionStatuses.unknown,
};

export const anonymousSessionState: SessionState = {
  ...initialSessionState,
  status: sessionStatuses.anonymous,
};
