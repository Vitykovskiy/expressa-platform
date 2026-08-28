import { expect, test } from "@fixtures/test";

/**
 * Назначение: customer видит понятное пустое состояние публичного меню.
 *
 * Предусловия: активные категории для публичного меню отсутствуют в профиле E2E `empty`.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение «Меню пока пустое».
 * - Customer не видит списка категорий и товаров.
 */
test("MENU-02: customer видит пустое публичное меню", async ({
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);

  await test.step("Customer видит сообщение «Меню пока пустое».", async () => {
    expect(
      await publicMenu.isEmptyVisible(),
      "Сообщение «Меню пока пустое» показано.",
    ).toBe(true);
  });
  await test.step("Customer не видит списка категорий и товаров.", async () => {
    expect(
      await publicMenu.isCategoriesAbsent(),
      "Список категорий не показан.",
    ).toBe(true);
    expect(
      await publicMenu.isProductsAbsent(),
      "Список товаров не показан.",
    ).toBe(true);
  });
});
