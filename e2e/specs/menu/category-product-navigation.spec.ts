import {
  createProductOrderScenarioData,
  expect,
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: покупатель последовательно открывает категорию и товар из публичного меню.
 *
 * Предусловия: в публичном меню есть категория с доступным товаром.
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель выбирает категорию.
 * 3. Покупатель открывает товар.
 *
 * Ожидаемый результат:
 * - Покупатель видит название выбранной категории и её товары.
 * - Покупатель видит название, описание и цену выбранного товара.
 * - Покупатель видит доступные варианты товара и группы добавок.
 */
test("MENU-04: покупатель открывает категорию и товар", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    await test.step("Подготовка: administrator публикует напиток с обязательной группой добавок.", async () => {
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
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(data.productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.S,
        data.productPrice,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.M,
        data.productPrice,
      );
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.L,
        data.productPrice,
      );
      await menuManagement.productEditor.save(data.productName);
      await menuManagement.modifierGroupEditor.openManagement();
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(data.modifierGroupName);
      await menuManagement.modifierGroupEditor.setRequired();
      await menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(
        data.modifierName,
      );
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.setOptionDefault();
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(data.categoryName);
      await menuManagement.assignments.selectGroup(data.modifierGroupName);
      await menuManagement.assignments.save();
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);

    await test.step("Покупатель видит название выбранной категории и её товары.", async () => {
      expect(
        await publicMenu.readOpenedCategoryName(),
        "Открыта созданная категория.",
      ).toBe(data.categoryName);
      expect(
        await publicMenu.readOpenedProductNames(),
        "В открытой категории показан созданный товар.",
      ).toEqual([data.productName]);
    });
    await publicMenu.product.openProduct(data.productName);

    await test.step("Покупатель видит название, описание и цену выбранного товара.", async () => {
      expect(
        await publicMenu.product.readOpenedProductTitle(),
        "Открыта конфигурация созданного товара.",
      ).toBe(data.productName);
      expect(
        await publicMenu.product.isProductDescriptionVisible(
          data.productDescription,
        ),
        "Описание созданного товара показано.",
      ).toBe(true);
      expect(
        await publicMenu.product.readProductPrice(),
        "Цена выбранного размера показана.",
      ).toContain("1,99");
    });
    await test.step("Покупатель видит доступные варианты товара и группы добавок.", async () => {
      expect(
        await publicMenu.product.readVariants(),
        "Доступны размеры напитка S, M и L.",
      ).toEqual([
        ProductConfiguratorSize.S,
        ProductConfiguratorSize.M,
        ProductConfiguratorSize.L,
      ]);
      expect(
        await publicMenu.product.readModifierGroupNames(),
        "Показана назначенная группа добавок.",
      ).toEqual([data.modifierGroupName]);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категорию, товар и группу добавок.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
    });
  }
});
