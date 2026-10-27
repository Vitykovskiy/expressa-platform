export const EMPLOYEES_ENDPOINT = "/api/v3/backoffice/employees";
export const CUSTOMERS_ENDPOINT = "/api/v3/backoffice/customers";
export const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const USER_PHONE_PATTERN = /^\+7\d{10}$/;
export const USER_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const USER_COMMAND_ERRORS: Readonly<
  Record<string, { readonly status: number; readonly message: string }>
> = {
  VALIDATION_ERROR: {
    status: 400,
    message: "Проверьте имя, телефон и выбранную роль.",
  },
  USER_PHONE_CONFLICT: {
    status: 409,
    message:
      "Сотрудник с таким номером уже существует. Измените доступ в его карточке.",
  },
  USER_NAME_CONFLICT: {
    status: 409,
    message:
      "У аккаунта с этим номером другое имя. Уточните имя и сохраните новый черновик.",
  },
  USER_ACCESS_CONFLICT: {
    status: 409,
    message:
      "Изменение рабочего доступа отклонено. Проверьте глобальную блокировку аккаунта, собственную роль и наличие другого администратора.",
  },
  USER_NOT_FOUND: {
    status: 404,
    message: "Пользователь больше не найден. Обновите список.",
  },
};
