import { ProductEditorSize, ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание напитка с доступными размерами и ценами.
 *
 * Предусловия: администратор авторизован; в каталоге есть категория.
 *
 * Сценарий:
 * 1. Администратор нажимает «Добавить товар».
 * 2. Администратор выбирает категорию товара.
 * 3. Администратор выбирает тип «Напиток».
 * 4. Администратор указывает название товара.
 * 5. Администратор указывает цену размера S.
 * 6. Администратор указывает цену размера M.
 * 7. Администратор указывает цену размера L.
 * 8. Администратор сохраняет товар.
 *
 * Ожидаемый результат:
 * - Администратор видит созданный напиток в выбранной категории.
 * - В карточке товара показаны размеры S, M и L с указанными ценами.
 */
test("CATALOG-07: администратор создаёт напиток с размерами", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Напитки ${testInfo.testId}`;
  const productName = `E2E Напиток ${testInfo.testId}`;
  const prices = { s: "199", m: "249", l: "299" };

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();

  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription("Категория напитков");
    await menuManagement.categoryEditor.save(categoryName);

    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.DRINK);
    await menuManagement.productEditor.fillName(productName);
    await menuManagement.productEditor.setPrice(ProductEditorSize.S, prices.s);
    await menuManagement.productEditor.setPrice(ProductEditorSize.M, prices.m);
    await menuManagement.productEditor.setPrice(ProductEditorSize.L, prices.l);
    await menuManagement.productEditor.save(productName);

    await test.step("Администратор видит созданный напиток в выбранной категории.", async () => {
      expect(
        await menuManagement.catalog.isProductVisible(productName),
        "Созданный напиток показан в выбранной категории.",
      ).toBe(true);
    });
    await test.step("В карточке товара показаны размеры S, M и L с указанными ценами.", async () => {
      const card = await menuManagement.catalog.readProductPrice(productName);

      expect(card, "В карточке показан размер S с указанной ценой.").toContain(
        "S: 1.99 ₽",
      );
      expect(card, "В карточке показан размер M с указанной ценой.").toContain(
        "M: 2.49 ₽",
      );
      expect(card, "В карточке показан размер L с указанной ценой.").toContain(
        "L: 2.99 ₽",
      );
    });
  } finally {
    await menuManagement.productEditor.deleteIfPresent(productName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
