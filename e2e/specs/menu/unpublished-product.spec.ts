import {
  AvailabilityState,
  createProductOrderScenarioData,
  expect,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не видит товар без корректной конфигурации публикации.
 *
 * Предусловия: в активной категории есть опубликованный доступный товар и товар, который не может быть опубликован из-за отсутствия доступного размера или корректного набора добавок по умолчанию.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer выбирает активную категорию.
 *
 * Ожидаемый результат:
 * - Customer видит опубликованный доступный товар.
 * - Customer не видит товар без корректной конфигурации публикации.
 */
test("MENU-07: customer не видит товар без доступного размера", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const publishedProductName = `${data.productName} опубликован`;
  const unpublishedProductName = `${data.productName} без размера`;
  const unavailableSizeName = `${unpublishedProductName} · ${ProductEditorSize.M}`;

  try {
    await test.step("Подготовка: administrator публикует товар и делает единственный размер второго товара недоступным.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(data.categoryName);
      await menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.categoryEditor.save(data.categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(data.categoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(publishedProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(publishedProductName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(data.categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(unpublishedProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.M,
        data.productPrice,
      );
      await menuManagement.productEditor.save(unpublishedProductName);
      await availabilityManagement.open();
      await availabilityManagement.list.setSizeAvailability(
        unavailableSizeName,
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);

    await test.step("Customer видит опубликованный доступный товар.", async () => {
      expect(
        await publicMenu.product.isProductVisible(publishedProductName),
        "Опубликованный доступный товар показан в категории.",
      ).toBe(true);
    });
    await test.step("Customer не видит товар без корректной конфигурации публикации.", async () => {
      expect(
        await publicMenu.product.isProductAbsent(unpublishedProductName),
        "Товар без доступного размера отсутствует в публичном меню.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность размера и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setSizeAvailability(
        unavailableSizeName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(publishedProductName);
      await menuManagement.productEditor.deleteIfPresent(
        unpublishedProductName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    });
  }
});
