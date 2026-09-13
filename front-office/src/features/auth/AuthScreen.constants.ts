import { CircleCheck, Phone, UserRound } from "lucide-vue-next";
import type { AuthScreenPresentation } from "./AuthScreen.types";

export const AUTH_SCREEN_PRESENTATION = {
  phone: {
    icon: Phone,
    iconTone: "default",
    content: "form",
    title: "Введите номер телефона",
    description: () =>
      "Подтвердите номер, чтобы оформить заказ и посмотреть историю заказов.",
  },
  otp: {
    icon: Phone,
    iconTone: "default",
    content: "form",
    title: "Введите код",
    description: (state) =>
      `Отправили код на ${state.phone}. Введите его для подтверждения.`,
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
  success: {
    icon: CircleCheck,
    iconTone: "success",
    content: "success",
    title: "Телефон подтверждён",
    description: () => "Вы можете продолжить оформление заказа.",
  },
} satisfies AuthScreenPresentation;
