import { ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить создание товара с единой ценой без размеров.
 *
 * Предусловия: изолированный профиль `mutating` содержит категорию «Кофе» и предоставляет доступную роль администратора.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает создание товара.
 * 3. Администратор выбирает категорию «Кофе».
 * 4. Администратор выбирает тип товара без размеров.
 * 5. Администратор указывает название товара.
 * 6. Администратор указывает единую цену товара.
 * 7. Администратор сохраняет товар.
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
  const productName = `E2E Закуска ${testInfo.testId}`;

  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.productEditor.startCreation();
  await menuManagement.productEditor.selectCategory("Кофе");
  await menuManagement.productEditor.selectType(ProductType.OTHER);
  await menuManagement.productEditor.fillName(productName);
  await menuManagement.productEditor.setSinglePrice("349");
  await menuManagement.productEditor.save(productName);

  await test.step("Администратор видит созданный товар в выбранной категории.", async () => {
    expect(
      await menuManagement.catalog.isProductVisible(productName),
      "Созданный товар показан в выбранной категории.",
    ).toBe(true);
  });
  await test.step("У товара показана единая цена без размеров.", async () => {
    const card = await menuManagement.catalog.readProductPrice(productName);

    expect(card, "В карточке показана единая цена товара.").toContain("3.49 ₽");
    expect(card, "В карточке не показан размер S.").not.toContain("S:");
    expect(card, "В карточке не показан размер M.").not.toContain("M:");
    expect(card, "В карточке не показан размер L.").not.toContain("L:");
  });
});
