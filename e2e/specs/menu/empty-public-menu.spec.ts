import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: покупатель видит понятное пустое состояние публичного меню.
 *
 * Предусловия: активные категории для публичного меню отсутствуют в профиле E2E `empty`.
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Покупатель видит сообщение «Меню пока пустое».
 * - Покупатель не видит списка категорий и товаров.
 */
test("MENU-02: покупатель видит пустое публичное меню", async ({
  page,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);

  await expectedResult(
    "Покупатель видит сообщение «Меню пока пустое».",
    page,
    async () => {
      expect(
        await publicMenu.isEmptyVisible(),
        "Сообщение «Меню пока пустое» показано.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Покупатель не видит списка категорий и товаров.",
    page,
    async () => {
      expect(
        await publicMenu.isCategoriesAbsent(),
        "Список категорий не показан.",
      ).toBe(true);
      expect(
        await publicMenu.isProductsAbsent(),
        "Список товаров не показан.",
      ).toBe(true);
    },
  );
});
