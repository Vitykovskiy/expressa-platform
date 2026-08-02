export const CUSTOMER_JOURNEY_OTP = "1234";

export const CUSTOMER_JOURNEY_KNOWN_PHONE_NUMBERS = new Set([
  "79001234567",
  "79991112233",
]);

export const CUSTOMER_JOURNEY_AUTH_GATE_COPY = {
  title: "Требуется подтверждение",
  message: "Для доступа к этому разделу необходимо подтвердить номер телефона.",
  note: "Вход по номеру телефона: вы получите одноразовый код для подтверждения.",
  confirmLabel: "Подтвердить номер телефона",
} as const;
