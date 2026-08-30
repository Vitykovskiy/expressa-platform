import {
  ProductEditorSize,
  ProductType,
  expect,
  expectedResult,
  test,
} from "@fixtures/test";

/**
 * Назначение: подтвердить, что напиток не сохраняется без корректной цены каждого выбранного размера.
 *
 * Предусловия: изолированный профиль `mutating` содержит категорию «Кофе» и предоставляет доступную роль администратора.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает создание товара.
 * 3. Администратор выбирает категорию «Кофе».
 * 4. Администратор выбирает тип «Напиток».
 * 5. Администратор указывает название товара.
 * 6. Администратор указывает цену размера M.
 * 7. Администратор указывает цену размера L.
 * 8. Администратор указывает отрицательную цену размера S.
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение «Укажите цену для каждого выбранного размера».
 * - Действие сохранения товара недоступно.
 */
test("CATALOG-09: администратор видит валидацию цены напитка", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.productEditor.startCreation();
  await menuManagement.productEditor.selectCategory("Кофе");
  await menuManagement.productEditor.selectType(ProductType.DRINK);
  await menuManagement.productEditor.fillName(`E2E Напиток ${testInfo.testId}`);
  await menuManagement.productEditor.setPrice(ProductEditorSize.M, "249");
  await menuManagement.productEditor.setPrice(ProductEditorSize.L, "299");
  await menuManagement.productEditor.setPrice(ProductEditorSize.S, "-1");

  await expectedResult(
    "Администратор видит сообщение «Укажите цену для каждого выбранного размера».",
    page,
    async () => {
      expect(
        await menuManagement.productEditor.readSizesPriceValidation(),
        "Показано сообщение «Укажите цену для каждого выбранного размера».",
      ).toBe("Укажите цену для каждого выбранного размера");
    },
  );
  await expectedResult(
    "Действие сохранения товара недоступно.",
    page,
    async () => {
      expect(
        await menuManagement.productEditor.isCreateSaveAvailable(),
        "Действие сохранения товара недоступно.",
      ).toBe(false);
    },
  );
});
