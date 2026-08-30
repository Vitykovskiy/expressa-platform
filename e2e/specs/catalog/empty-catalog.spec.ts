import { expectedResult, expect, test } from "@fixtures/test";

/**
 * Назначение: администратор видит понятное состояние каталога без категорий.
 *
 * Предусловия: изолированный профиль `empty` предоставляет доступную роль администратора и пустой каталог.
 *
 * Сценарий:
 * 1. Администратор открывает раздел «Меню».
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение «Категорий пока нет. Добавьте первую категорию».
 * - Администратор видит действия добавления категории и товара.
 */
test("CATALOG-01: администратор видит пустой каталог", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await expectedResult(
    "Администратор видит сообщение «Категорий пока нет. Добавьте первую категорию».",
    page,
    async () => {
      expect(
        await menuManagement.catalog.isEmpty(),
        "Сообщение о пустом каталоге показано.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Администратор видит действия добавления категории и товара.",
    page,
    async () => {
      expect(
        await menuManagement.catalog.isAddCategoryAvailable(),
        "Действие добавления категории доступно.",
      ).toBe(true);
      expect(
        await menuManagement.catalog.isAddProductAvailable(),
        "Действие добавления товара доступно.",
      ).toBe(true);
    },
  );
});
