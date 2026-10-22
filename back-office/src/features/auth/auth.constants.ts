export const OTP_REQUEST_ENDPOINT = "/api/v2/auth/otp/request";
export const OTP_PATTERN = /^\d{6}$/;
export const PHONE_CHARACTERS = /^[+\d().\s-]+$/;
export const PHONE_NATIONAL_PATTERN = /^[3-9]\d{9}$/;
export const PHONE_PREFIXED_PATTERN = /^[78]\d{10}$/;
export const PHONE_INTERNATIONAL_PATTERN = /^7\d{10}$/;
export const COOLDOWN_SECOND_MS = 1000;

export const AUTH_MESSAGES = {
  sendUnavailable: "Не удалось отправить код. Попробуйте ещё раз.",
  sendUncertain: "Ответ не получен. Попробуйте запросить код ещё раз.",
  cooldown: "Код пока нельзя запросить повторно. Попробуйте немного позже.",
  verifyUnavailable: "Не удалось подтвердить вход. Попробуйте ещё раз.",
  verifyUncertain:
    "Не удалось проверить вход. Измените номер и войдите заново.",
  sessionLost: "Сеанс завершён. Войдите ещё раз.",
  logoutFailure:
    "Не удалось завершить сеанс. Попробуйте изменить номер ещё раз.",
} as const;
