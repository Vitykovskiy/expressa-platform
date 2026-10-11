export const associationVersionPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const associationCopy = {
  none: "Не подключены к вашему аккаунту",
  current: "Подключены к вашему аккаунту",
  other: "Подписка связана с другим аккаунтом",
} as const;
export const notificationActionLabels = {
  enable: "Включить уведомления",
  disable: "Отключить уведомления",
  read: "Проверить состояние",
  finish: "Завершить проверку",
} as const;
