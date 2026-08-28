import type { SessionState } from "./session.store.types";

export const sessionStatuses = {
  anonymous: "anonymous",
  authenticated: "authenticated",
  unknown: "unknown",
} as const;

export const sessionMessages = {
  dependenciesNotConfigured: "Зависимости сессии не настроены.",
  invalidOtpCode: "Одноразовый код недействителен.",
  operationFailed: "Не удалось выполнить операцию сессии.",
  roleRejected: "Эта учётная запись не является клиентской.",
} as const;

export const sessionErrorCodes = {
  invalidOtpCode: "AUTH_CODE_INVALID",
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
