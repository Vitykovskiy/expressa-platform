import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: покупатель видит опубликованные категории публичного меню.
 *
 * Предусловия: изолированный профиль `seeded` содержит активные категории «Кофе» и «Выпечка» с опубликованными товарами.
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Покупатель видит активные категории в заданном порядке.
 * - Для каждой категории показано количество товаров.
 */
test("MENU-01: покупатель видит опубликованное меню", async ({
  page,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);

  await expectedResult(
    "Покупатель видит активные категории в заданном порядке.",
    page,
    async () => {
      expect(
        await publicMenu.readCategoryNames(),
        "Активные категории показаны в порядке профиля.",
      ).toEqual(["Кофе", "Выпечка"]);
    },
  );
  await expectedResult(
    "Для каждой категории показано количество товаров.",
    page,
    async () => {
      expect(
        await publicMenu.readCategoryProductCounts(),
        "Для категорий показано количество опубликованных товаров.",
      ).toEqual([2, 2]);
    },
  );
});
