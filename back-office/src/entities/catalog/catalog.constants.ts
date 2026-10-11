export const catalogEndpoint = "/api/v3/backoffice/catalog";
export const categoryEndpoint = "/api/v2/backoffice/catalog/categories";
export const productEndpoint = "/api/v3/backoffice/catalog/products";
export const catalogInt32Maximum = 2147483647;
export const catalogUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const categoryFieldErrors = {
  name: "Введите название",
  description: "Проверьте описание",
  sortOrder: "Введите целое число от 0 до 2147483647",
  isActive: "Проверьте активность категории",
} as const;
export const productFieldErrors = {
  name: "Введите название",
  categoryId: "Выберите текущую категорию",
  description: "Проверьте описание",
  sortOrder: "Введите целое число от 0 до 2147483647",
  price: "Введите целую цену от 0 до 2147483647 ₽",
  portionLabel: "Проверьте название порции",
  isActive: "Проверьте активность товара",
  isAvailable: "Проверьте доступность товара",
  mode: "Проверьте ценовую модель",
} as const;
export const productChoiceFieldErrors = {
  portionLabel: "Введите непустое отличающееся название порции",
  price: "Введите целую цену от 0 до 2147483647 ₽",
  sortOrder: "Введите отличающийся целый порядок от 0 до 2147483647",
  isAvailable: "Проверьте доступность опции",
  row: "Проверьте поля опции",
} as const;
