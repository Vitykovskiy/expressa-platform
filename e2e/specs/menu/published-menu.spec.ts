import {
  createProductOrderScenarioData,
  expect,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer видит опубликованные категории публичного меню.
 *
 * Предусловия: в меню есть две активные категории с описаниями и опубликованными доступными товарами; их порядок задан administrator.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Customer видит активные категории в заданном порядке.
 * - Для каждой категории показаны её название и количество товаров.
 */
test("MENU-01: customer видит опубликованное меню", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const firstCategoryName = `${data.categoryName} первая`;
  const secondCategoryName = `${data.categoryName} вторая`;
  const firstProductName = `${data.productName} первый`;
  const secondProductName = `${data.productName} второй`;

  try {
    await test.step("Подготовка: administrator публикует две категории с товарами.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(firstCategoryName);
      await menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.categoryEditor.save(firstCategoryName);
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(secondCategoryName);
      await menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.categoryEditor.save(secondCategoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(firstCategoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(firstProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(firstProductName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(secondCategoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(secondProductName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setSinglePrice(data.productPrice);
      await menuManagement.productEditor.save(secondProductName);
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);

    await test.step("Customer видит активные категории в заданном порядке.", async () => {
      expect(
        await publicMenu.readCategoryNames(),
        "Активные категории показаны в заданном порядке.",
      ).toEqual([firstCategoryName, secondCategoryName]);
    });
    await test.step("Для каждой категории показаны её название и количество товаров.", async () => {
      expect(
        await publicMenu.readCategoryProductCounts(),
        "Для каждой опубликованной категории показано количество товаров.",
      ).toEqual([1, 1]);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категории и товары.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(firstCategoryName);
      await menuManagement.productEditor.deleteIfPresent(firstProductName);
      await menuManagement.catalog.expandCategoryIfPresent(secondCategoryName);
      await menuManagement.productEditor.deleteIfPresent(secondProductName);
      await menuManagement.categoryEditor.archiveIfPresent(firstCategoryName);
      await menuManagement.categoryEditor.archiveIfPresent(secondCategoryName);
    });
  }
});
