export const OTP_PATTERN = /^\d{6}$/;
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
