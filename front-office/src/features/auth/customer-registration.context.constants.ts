import type { InjectionKey } from "vue";
import type { CustomerRegistrationContext } from "./customer-registration.context.types";

export const customerRegistrationKey: InjectionKey<CustomerRegistrationContext> =
  Symbol("customer-registration");

export const customerRegistrationMessages = {
  notConfigured: "Регистрация клиента не настроена.",
  saveFailed: "Не удалось сохранить имя. Попробуйте ещё раз.",
  nameConflict:
    "Имя не совпадает с именем аккаунта. Войдите снова, чтобы подтвердить актуальное имя.",
  resultUnknown:
    "Не удалось подтвердить регистрацию. Повторите: сохранённое имя не изменится.",
  confirmName:
    "Это имя уже сохранено в аккаунте. Подтвердите его для заказов и истории.",
} as const;
