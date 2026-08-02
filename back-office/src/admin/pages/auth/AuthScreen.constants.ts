import type { AuthScreenPresentation } from "./AuthScreen.types";

export const AUTH_SCREEN_PRESENTATION = {
  phone: { content: "phone", title: "Вход в backoffice" },
  otp: { content: "otp", title: "Введите код из сообщения" },
  loading: { content: "loading" },
  denied: { content: "denied" },
  success: { content: "success" },
} satisfies AuthScreenPresentation;
