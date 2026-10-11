export const modifierEndpoint = "/api/v2/backoffice/catalog/modifier-groups";
export const modifierFieldErrors = {
  name: "Введите название",
  selectionType: "Выберите тип выбора",
  minSelect: "Введите целое число от 0 до 2147483647",
  maxSelect: "Введите целое число не меньше минимума; для одного варианта — 1",
  isActive: "Проверьте активность группы",
} as const;
export const modifierOptionFieldErrors = {
  name: "Введите название добавки",
  priceDelta: "Введите целую доплату от 0 до 2147483647 ₽",
  sortOrder: "Введите уникальный целый порядок от 0 до 2147483647",
  isDefault: "Проверьте выбор по умолчанию",
  isAvailable: "Проверьте доступность добавки",
  row: "Добавка изменилась. Проверьте каталог",
} as const;
