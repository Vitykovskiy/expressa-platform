import { ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение данных существующего товара.
 *
 * Предусловия: администратор авторизован; в категории есть товар.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает редактирование товара.
 * 3. Администратор изменяет название товара.
 * 4. Администратор сохраняет изменения.
 *
 * Ожидаемый результат:
 * - Администратор видит товар с новым названием в исходной категории.
 */
test("CATALOG-10: администратор редактирует товар", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Редактирование ${testInfo.testId}`;
  const initialProductName = `E2E Исходный товар ${testInfo.testId}`;
  const productName = `E2E Изменённый товар ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);

  try {
    await menuManagement.open();
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription(
      "Категория редактирования",
    );
    await menuManagement.categoryEditor.save(categoryName);
    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.OTHER);
    await menuManagement.productEditor.fillName(initialProductName);
    await menuManagement.productEditor.setSinglePrice("299");
    await menuManagement.productEditor.save(initialProductName);

    await menuManagement.open();
    await menuManagement.productEditor.openForEditing(initialProductName);
    await menuManagement.productEditor.fillName(productName);
    await menuManagement.productEditor.saveChanges(productName);

    await test.step("Администратор видит товар с новым названием в исходной категории.", async () => {
      expect(
        await menuManagement.catalog.isProductVisible(productName),
        "Товар с новым названием показан в исходной категории.",
      ).toBe(true);
    });
  } finally {
    await menuManagement.productEditor.deleteIfPresent(productName);
    await menuManagement.productEditor.deleteIfPresent(initialProductName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
