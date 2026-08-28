import { ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание товара с единой ценой без размеров.
 *
 * Предусловия: администратор авторизован; в каталоге есть категория.
 *
 * Сценарий:
 * 1. Администратор нажимает «Добавить товар».
 * 2. Администратор выбирает категорию товара.
 * 3. Администратор выбирает тип «Товар без размеров».
 * 4. Администратор указывает название товара.
 * 5. Администратор указывает единую цену товара.
 * 6. Администратор сохраняет товар.
 *
 * Ожидаемый результат:
 * - Администратор видит созданный товар в выбранной категории.
 * - У товара показана единая цена без размеров.
 */
test("CATALOG-08: администратор создаёт товар без размеров", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Закуски ${testInfo.testId}`;
  const productName = `E2E Закуска ${testInfo.testId}`;
  const price = "349";

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();

  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription("Категория закусок");
    await menuManagement.categoryEditor.save(categoryName);

    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.OTHER);
    await menuManagement.productEditor.fillName(productName);
    await menuManagement.productEditor.setSinglePrice(price);
    await menuManagement.productEditor.save(productName);

    await test.step("Администратор видит созданный товар в выбранной категории.", async () => {
      expect(
        await menuManagement.catalog.isProductVisible(productName),
        "Созданный товар показан в выбранной категории.",
      ).toBe(true);
    });
    await test.step("У товара показана единая цена без размеров.", async () => {
      const card = await menuManagement.catalog.readProductPrice(productName);

      expect(card, "В карточке показана единая цена товара.").toContain(
        "3.49 ₽",
      );
      expect(card, "В карточке не показан размер S.").not.toContain("S:");
      expect(card, "В карточке не показан размер M.").not.toContain("M:");
      expect(card, "В карточке не показан размер L.").not.toContain("L:");
    });
  } finally {
    await menuManagement.productEditor.deleteIfPresent(productName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
