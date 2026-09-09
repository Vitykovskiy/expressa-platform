export const staffRoles = ["barista", "administrator"] as const;

export const sessionErrorMessage = "Не удалось обновить сессию.";
export const otpRateLimitedMessage =
  "Слишком много попыток. Подождите немного и попробуйте снова.";
export const otpRequestFailedMessage =
  "Не удалось отправить код. Попробуйте ещё раз.";
export const otpVerifyFailedMessage =
  "Не удалось подтвердить код. Попробуйте ещё раз.";
export const otpInvalidMessage = "Неверный код. Попробуйте ещё раз.";
export const otpExpiredMessage =
  "Срок действия кода истёк. Запросите новый код.";
