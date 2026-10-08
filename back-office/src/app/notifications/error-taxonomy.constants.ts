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
  "auth.otp.request": "Не удалось отправить код",
  "auth.otp.verify": "Не удалось подтвердить код",
  "auth.refresh": "Не удалось восстановить сессию",
  "auth.logout": "Не удалось выйти",
  "auth.currentUser": "Не удалось получить данные пользователя",
  "catalog.get": "Не удалось обновить меню",
  "catalog.category.create": "Не удалось создать категорию",
  "catalog.category.update": "Не удалось сохранить категорию",
  "catalog.category.reorder": "Не удалось сохранить порядок категорий",
  "catalog.category.archive": "Не удалось архивировать категорию",
  "catalog.product.create": "Не удалось создать товар",
  "catalog.product.update": "Не удалось сохранить товар",
  "catalog.product.reorder": "Не удалось сохранить порядок товаров",
  "catalog.product.archive": "Не удалось архивировать товар",
  "catalog.modifierGroup.save": "Не удалось сохранить группу добавок",
  "catalog.modifierGroup.archive": "Не удалось архивировать группу добавок",
  "catalog.modifierOption.create": "Не удалось создать добавку",
  "catalog.modifierOption.update": "Не удалось сохранить добавку",
  "catalog.modifierOption.archive": "Не удалось архивировать добавку",
  "catalog.category.modifiers": "Не удалось сохранить добавки категории",
  "orders.list": "Не удалось обновить список заказов",
  "orders.details": "Не удалось обновить заказ",
  "orders.transition": "Не удалось изменить статус заказа",
  "availability.get": "Не удалось обновить доступность",
  "availability.update": "Не удалось сохранить доступность",
  "availability.intake": "Не удалось сохранить приём заказов",
  "catalog.createCategory": "Не удалось создать категорию",
  "catalog.load": "Не удалось загрузить меню",
  "catalog.refresh": "Не удалось обновить список",
  "catalog.refreshLongContent":
    "Не удалось обновить список. Проверьте подключение и повторите действие после восстановления доступа к сети.",
  "catalog.reorder": "Не удалось сохранить порядок",
  "catalog.reorder.compensate": "Не удалось восстановить порядок",
  "catalog.save": "Не удалось сохранить изменения",
  "notifications.enable": "Не удалось включить уведомления",
  "session.logout": "Не удалось выйти",
} as const;

export const outcomeMessages = {
  "catalog.saved": { level: "success", message: "Изменения сохранены" },
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

export const requestSuccessMessages = {
  "auth.otp.request": "Код отправлен",
  "auth.otp.verify": "Код подтверждён",
  "auth.refresh": "Сессия обновлена",
  "auth.logout": "Вы вышли",
  "auth.currentUser": "Данные пользователя получены",
  "catalog.get": "Меню обновлено",
  "catalog.category.create": "Категория создана",
  "catalog.category.update": "Категория сохранена",
  "catalog.category.reorder": "Порядок категорий сохранён",
  "catalog.category.archive": "Категория архивирована",
  "catalog.product.create": "Товар создан",
  "catalog.product.update": "Товар сохранён",
  "catalog.product.reorder": "Порядок товаров сохранён",
  "catalog.product.archive": "Товар архивирован",
  "catalog.modifierGroup.save": "Группа добавок сохранена",
  "catalog.modifierGroup.archive": "Группа добавок архивирована",
  "catalog.modifierOption.create": "Добавка создана",
  "catalog.modifierOption.update": "Добавка сохранена",
  "catalog.modifierOption.archive": "Добавка архивирована",
  "catalog.category.modifiers": "Добавки категории сохранены",
  "orders.list": "Список заказов обновлён",
  "orders.details": "Заказ обновлён",
  "orders.transition": "Статус заказа изменён",
  "availability.get": "Доступность обновлена",
  "availability.update": "Доступность сохранена",
  "availability.intake": "Приём заказов сохранён",
} as const;
