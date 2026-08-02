import { Check, Phone, UserRound, X } from "lucide-vue-next";
import type { AuthScreenPresentation } from "./AuthScreen.types";

export const AUTH_SCREEN_PRESENTATION = {
  phone: {
    icon: Phone,
    iconTone: "default",
    content: "form",
    title: "Введите номер телефона",
    description: () => "Отправим одноразовый код для входа.",
  },
  otp: {
    icon: Phone,
    iconTone: "default",
    content: "form",
    title: "Введите код из сообщения",
    description: (state) => `Код отправлен на ${state.phone}`,
  },
  register: {
    icon: UserRound,
    iconTone: "default",
    content: "form",
    title: "Как к вам обращаться?",
    description: () => "Имя нужно для заказов и истории.",
  },
  loading: {
    icon: Phone,
    iconTone: "default",
    content: "loading",
    title: "Подождите...",
    description: () => "Обрабатываем запрос...",
  },
  error: {
    icon: X,
    iconTone: "error",
    content: "form",
    title: "Ошибка подтверждения",
    description: (state) => state.errorMessage,
  },
  success: {
    icon: Check,
    iconTone: "success",
    content: "success",
    title: "Телефон подтверждён",
    description: () => "Вы можете продолжить оформление заказа.",
  },
} satisfies AuthScreenPresentation;
