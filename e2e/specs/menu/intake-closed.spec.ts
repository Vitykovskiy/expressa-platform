import {
  AvailabilityState,
  createProductOrderScenarioData,
  expect,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer просматривает меню при временно закрытом приёме новых заказов.
 *
 * Предусловия: в публичном меню есть активная категория с доступным товаром. Приём новых заказов закрыт.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение «Новые заказы временно не принимаются».
 * - Customer видит доступные категории и количество товаров в каждой из них.
 */
test("MENU-03: customer видит меню при закрытом приёме заказов", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    await test.step("Подготовка: administrator публикует товар и закрывает приём заказов.", async () => {
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
      await menuManagement.productEditor.fillName(data.productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(data.productName);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);

    await test.step("Customer видит сообщение «Новые заказы временно не принимаются».", async () => {
      expect(
        await publicMenu.isIntakeClosed(),
        "Показано сообщение о временно закрытом приёме заказов.",
      ).toBe(true);
    });
    await test.step("Customer видит доступные категории и количество товаров в каждой из них.", async () => {
      const [categoryNames, productCounts] = await Promise.all([
        publicMenu.readCategoryNames(),
        publicMenu.readCategoryProductCounts(),
      ]);

      expect(
        categoryNames,
        "Созданная доступная категория показана в меню.",
      ).toContain(data.categoryName);
      expect(
        productCounts[categoryNames.indexOf(data.categoryName)],
        "Для созданной категории показано количество доступных товаров.",
      ).toBe(1);
    });
  } finally {
    await test.step("Очистка: administrator открывает приём заказов и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(AvailabilityState.AVAILABLE);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    });
  }
});
