import type { SessionState } from "./session.store.types";
import type { AccessSession } from "@/shared/api/auth.api.types";

export const logoutPromises = new WeakMap<object, Promise<void>>();
export const authenticationRequests = new WeakMap<
  object,
  Promise<AccessSession>
>();

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
  contextRejected: "Войдите в клиентское приложение по телефону.",
  verifyOtp: "Не удалось подтвердить код. Попробуйте ещё раз.",
  completeRegistration: "Не удалось сохранить имя. Попробуйте ещё раз.",
} as const;

export const sessionErrorCodes = {
  expiredOtpCode: "AUTH_CODE_EXPIRED",
  invalidOtpCode: "AUTH_CODE_INVALID",
  otpRateLimited: "AUTH_RATE_LIMITED",
} as const;

export const initialSessionState: SessionState = {
  accessToken: null,
  generation: 0,
  currentUser: null,
  errorMessage: null,
  otpCooldownUntil: null,
  otpExpiresAt: null,
  otpRequestMetadata: null,
  otpRequestId: 0,
  otpRequestedAt: null,
  pendingPhone: null,
  phone: null,
  restorePromise: null,
  registrationPending: false,
  status: sessionStatuses.unknown,
};

export const anonymousSessionState: SessionState = {
  ...initialSessionState,
  status: sessionStatuses.anonymous,
};
