export const modifierNumericFields = [
  { field: "minSelect", label: "Минимум выбора" },
  { field: "maxSelect", label: "Максимум выбора" },
] as const;
export const modifierOptionNumericFields = [
  { field: "priceDelta", label: "Доплата, ₽" },
  { field: "sortOrder", label: "Порядок" },
] as const;
export const modifierOptionFlags = [
  { field: "isDefault", label: "По умолчанию" },
  { field: "isAvailable", label: "Доступна" },
] as const;
