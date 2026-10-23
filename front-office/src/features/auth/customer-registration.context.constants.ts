import type { InjectionKey } from "vue";
import type { CustomerRegistrationContext } from "./customer-registration.context.types";

export const customerRegistrationKey: InjectionKey<CustomerRegistrationContext> =
  Symbol("customer-registration");

export const customerRegistrationMessages = {
  notConfigured: "Регистрация клиента не настроена.",
  saveFailed: "Не удалось сохранить имя. Попробуйте ещё раз.",
} as const;
