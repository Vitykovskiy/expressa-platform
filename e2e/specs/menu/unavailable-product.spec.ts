import {
  AvailabilityState,
  createProductOrderScenarioData,
  expect,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не может выбрать недоступный товар из публичного меню.
 *
 * Предусловия: в публичном меню есть категория с доступным и недоступным товарами.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer выбирает категорию с недоступным товаром.
 * 3. Customer открывает доступный товар.
 *
 * Ожидаемый результат:
 * - Customer видит недоступный товар в списке товаров категории.
 * - Customer не может открыть недоступный товар.
 * - Customer видит карточку доступного товара той же категории.
 */
test("MENU-06: customer не может открыть недоступный товар", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const unavailableProductName = `${data.productName} недоступен`;
  const availableProductName = `${data.productName} доступен`;

  try {
    await test.step("Подготовка: administrator публикует доступный и недоступный товары одной категории.", async () => {
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
      await menuManagement.productEditor.fillName(unavailableProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(unavailableProductName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(data.categoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(availableProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(availableProductName);
      await availabilityManagement.open();
      await availabilityManagement.list.setProductAvailability(
        unavailableProductName,
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);

    await test.step("Customer видит недоступный товар в списке товаров категории.", async () => {
      expect(
        await publicMenu.product.isProductVisible(unavailableProductName),
        "Недоступный товар показан в списке товаров категории.",
      ).toBe(true);
    });
    await test.step("Customer не может открыть недоступный товар.", async () => {
      expect(
        await publicMenu.product.isProductOpenable(unavailableProductName),
        "Кнопка открытия недоступного товара недоступна.",
      ).toBe(false);
    });
    await test.step("Customer видит карточку доступного товара той же категории.", async () => {
      expect(
        await publicMenu.product.isProductVisible(availableProductName),
        "Карточка доступного товара показана.",
      ).toBe(true);
    });
    await publicMenu.product.openProduct(availableProductName);
  } finally {
    await test.step("Очистка: administrator возвращает доступность и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setProductAvailability(
        unavailableProductName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(
        unavailableProductName,
      );
      await menuManagement.productEditor.deleteIfPresent(availableProductName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    });
  }
});
