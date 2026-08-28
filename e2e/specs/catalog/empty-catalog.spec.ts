import { expect, test } from "@fixtures/test";

/**
 * Назначение: administrator видит понятное состояние каталога без категорий.
 *
 * Предусловия: administrator авторизован; в профиле E2E `empty` в каталоге нет категорий.
 *
 * Сценарий:
 * 1. Administrator открывает раздел «Меню».
 *
 * Ожидаемый результат:
 * - Administrator видит сообщение «Категорий пока нет. Добавьте первую категорию».
 * - Administrator видит действия добавления категории и товара.
 */
test("CATALOG-01: administrator видит пустой каталог", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  await test.step("Предусловие: administrator входит в back-office.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();

  await test.step("Administrator видит сообщение «Категорий пока нет. Добавьте первую категорию».", async () => {
    expect(
      await menuManagement.catalog.isEmpty(),
      "Сообщение о пустом каталоге показано.",
    ).toBe(true);
  });
  await test.step("Administrator видит действия добавления категории и товара.", async () => {
    expect(
      await menuManagement.catalog.isAddCategoryAvailable(),
      "Действие добавления категории доступно.",
    ).toBe(true);
    expect(
      await menuManagement.catalog.isAddProductAvailable(),
      "Действие добавления товара доступно.",
    ).toBe(true);
  });
});
