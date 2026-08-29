import { ProductEditorSize, ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание напитка с доступными размерами и ценами.
 *
 * Предусловия: изолированный профиль `mutating` содержит категорию «Кофе» и предоставляет доступную роль администратора.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает создание товара.
 * 3. Администратор выбирает категорию «Кофе».
 * 4. Администратор выбирает тип «Напиток».
 * 5. Администратор указывает название товара.
 * 6. Администратор указывает цену размера S.
 * 7. Администратор указывает цену размера M.
 * 8. Администратор указывает цену размера L.
 * 9. Администратор сохраняет товар.
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
  const productName = `E2E Напиток ${testInfo.testId}`;

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.productEditor.startCreation();
  await menuManagement.productEditor.selectCategory("Кофе");
  await menuManagement.productEditor.selectType(ProductType.DRINK);
  await menuManagement.productEditor.fillName(productName);
  await menuManagement.productEditor.setPrice(ProductEditorSize.S, "199");
  await menuManagement.productEditor.setPrice(ProductEditorSize.M, "249");
  await menuManagement.productEditor.setPrice(ProductEditorSize.L, "299");
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
      "S: 199 ₽",
    );
    expect(card, "В карточке показан размер M с указанной ценой.").toContain(
      "M: 249 ₽",
    );
    expect(card, "В карточке показан размер L с указанной ценой.").toContain(
      "L: 299 ₽",
    );
  });
});
