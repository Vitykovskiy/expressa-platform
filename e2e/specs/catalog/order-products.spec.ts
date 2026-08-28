import { ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить изменение порядка товаров внутри категории.
 *
 * Предусловия: администратор авторизован; в категории есть два товара в известном порядке.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор раскрывает категорию.
 * 3. Администратор перемещает второй товар вверх.
 *
 * Ожидаемый результат:
 * - Администратор видит второй товар перед первым в выбранной категории.
 * - Для первого товара действие перемещения вверх недоступно.
 */
test("CATALOG-11: администратор меняет порядок товаров", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Порядок товаров ${testInfo.testId}`;
  const firstProductName = `E2E Первый товар ${testInfo.testId}`;
  const secondProductName = `E2E Второй товар ${testInfo.testId}`;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);

  try {
    await menuManagement.open();
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription("Категория порядка");
    await menuManagement.categoryEditor.save(categoryName);
    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.OTHER);
    await menuManagement.productEditor.fillName(firstProductName);
    await menuManagement.productEditor.setSinglePrice("199");
    await menuManagement.productEditor.save(firstProductName);
    await menuManagement.productEditor.startCreation();
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.OTHER);
    await menuManagement.productEditor.fillName(secondProductName);
    await menuManagement.productEditor.setSinglePrice("299");
    await menuManagement.productEditor.save(secondProductName);

    await menuManagement.open();
    await menuManagement.catalog.expandCategory(categoryName);
    await menuManagement.catalog.moveProductUp(secondProductName);

    await test.step("Администратор видит второй товар перед первым в выбранной категории.", async () => {
      expect(
        await menuManagement.catalog.readProductOrder(),
        "Второй товар показан перед первым в выбранной категории.",
      ).toEqual([secondProductName, firstProductName]);
    });
    await test.step("Для первого товара действие перемещения вверх недоступно.", async () => {
      expect(
        await menuManagement.catalog.isProductMoveUpAvailable(
          secondProductName,
        ),
        "Для первого товара действие перемещения вверх недоступно.",
      ).toBe(false);
    });
  } finally {
    await menuManagement.productEditor.deleteIfPresent(firstProductName);
    await menuManagement.productEditor.deleteIfPresent(secondProductName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
