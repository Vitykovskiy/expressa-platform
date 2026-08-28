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
 * Назначение: покупатель видит начальную конфигурацию доступного напитка с обязательной группой добавок.
 *
 * Предусловия: в публичном меню есть доступный напиток с доступным размером M, другим доступным размером и обязательной группой добавок с бесплатным вариантом по умолчанию.
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель выбирает категорию с напитком.
 * 3. Покупатель открывает напиток.
 *
 * Ожидаемый результат:
 * - Покупатель видит выбранный размер M.
 * - Покупатель видит выбранную бесплатную добавку обязательной группы.
 * - Покупатель видит начальное количество «1».
 * - Покупатель видит итоговую цену выбранной конфигурации.
 */
test("MENU-05: покупатель видит конфигурацию напитка по умолчанию", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    await test.step("Подготовка: administrator публикует напиток с бесплатной обязательной добавкой по умолчанию.", async () => {
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
    await publicMenu.product.openProduct(data.productName);

    await test.step("Покупатель видит выбранный размер M.", async () => {
      expect(
        await publicMenu.product.readSelectedSize(),
        "По умолчанию выбран размер M.",
      ).toBe(ProductConfiguratorSize.M);
    });
    await test.step("Покупатель видит выбранную бесплатную добавку обязательной группы.", async () => {
      expect(
        await publicMenu.product.readSelectedRequiredModifier(
          data.modifierGroupName,
        ),
        "По умолчанию выбрана бесплатная обязательная добавка.",
      ).toBe(data.modifierName);
    });
    await test.step("Покупатель видит начальное количество «1».", async () => {
      expect(
        await publicMenu.product.readQuantity(),
        "Начальное количество равно одному.",
      ).toBe(1);
    });
    await test.step("Покупатель видит итоговую цену выбранной конфигурации.", async () => {
      expect(
        await publicMenu.product.readConfigurationTotal(),
        "Итоговая цена выбранной конфигурации показана.",
      ).toContain("1,99");
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
