export const domainMessages = {
  AUTH_RATE_LIMITED: "Слишком много попыток",
  CATEGORY_ARCHIVED: "Категория архивирована",
  CATEGORY_NOT_FOUND: "Категория не найдена",
  CATEGORY_POSITION_CONFLICT: "Данные изменились",
  CATEGORY_REORDER_INVALID: "Данные изменились",
  FORBIDDEN: "Недостаточно прав",
  MENU_ITEM_UNAVAILABLE: "Позиция недоступна",
  ORDER_INTAKE_CLOSED: "Приём заказов закрыт",
  ORDER_NOT_FOUND: "Заказ не найден",
  ORDER_STAGE_CONFLICT: "Данные изменились",
  ORDER_TOTAL_CHANGED: "Сумма заказа изменилась",
  PRODUCT_ARCHIVED: "Товар архивирован",
  PRODUCT_CATEGORY_NOT_FOUND: "Категория не найдена",
  PRODUCT_NOT_FOUND: "Товар не найден",
  PRODUCT_POSITION_CONFLICT: "Данные изменились",
  PRODUCT_REORDER_INVALID: "Данные изменились",
  PUSH_ASSOCIATION_CONFLICT: "Данные изменились",
} as const;

export const operationMessages = {
  "catalog.createCategory": "Не удалось создать категорию",
  "catalog.load": "Не удалось загрузить меню",
  "catalog.refresh": "Не удалось обновить список",
  "catalog.refreshLongContent":
    "Не удалось обновить список. Проверьте подключение и повторите действие после восстановления доступа к сети.",
  "catalog.save": "Не удалось сохранить изменения",
  "notifications.enable": "Не удалось включить уведомления",
  "session.logout": "Не удалось выйти",
} as const;

export const outcomeMessages = {
  "notifications.enabled": {
    level: "success",
    message: "Уведомления включены",
  },
  "notifications.permissionDenied": {
    level: "warning",
    message: "Уведомления не разрешены",
  },
  "orders.new": { level: "info", message: "Новый заказ" },
  "session.expired": { level: "warning", message: "Сессия завершена" },
} as const;

export const validationMessages = {
  category: "Выберите категорию",
  description: "Проверьте описание",
  name: "Укажите название",
  numeric: "Проверьте значение",
} as const;

export const fieldConstraintMessages = {
  categoryId: {
    "Must be a UUID": validationMessages.category,
  },
  description: {
    "Must be a string": validationMessages.description,
    "Must be a string or null": validationMessages.description,
  },
  maxSelect: {
    "Must be a non-negative int32": validationMessages.numeric,
    "Must match selection type and minimum": validationMessages.numeric,
  },
  minSelect: {
    "Must be a non-negative int32": validationMessages.numeric,
  },
  name: {
    "Invalid category value": validationMessages.name,
    "Must be a non-empty string": validationMessages.name,
  },
  price: {
    "Must be a non-negative int32": validationMessages.numeric,
    "Must be a non-negative int32 or null": validationMessages.numeric,
  },
  priceDelta: {
    "Must be a non-negative int32": validationMessages.numeric,
    "Must be an int32": validationMessages.numeric,
  },
  sortOrder: {
    "Invalid category value": validationMessages.numeric,
    "Must be a non-negative int32": validationMessages.numeric,
  },
} as const;
