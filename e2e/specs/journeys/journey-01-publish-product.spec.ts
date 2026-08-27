import {
  expect,
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: administrator публикует напиток, доступный customer в публичном меню.
 *
 * Предусловия: administrator и customer могут войти в свои приложения; для сценария выбраны уникальные данные.
 *
 * Сценарий:
 * 1. Administrator входит в back-office.
 * 2. Administrator открывает управление меню.
 * 3. Administrator начинает создание категории.
 * 4. Administrator указывает название категории.
 * 5. Administrator указывает описание категории.
 * 6. Administrator сохраняет категорию.
 * 7. Administrator начинает создание напитка.
 * 8. Administrator выбирает категорию напитка.
 * 9. Administrator выбирает тип напитка.
 * 10. Administrator указывает название напитка.
 * 11. Administrator указывает описание напитка.
 * 12. Administrator устанавливает цену размера M.
 * 13. Administrator сохраняет напиток.
 * 14. Administrator открывает управление группами добавок.
 * 15. Administrator начинает создание группы добавок.
 * 16. Administrator указывает название группы добавок.
 * 17. Administrator делает выбор обязательным.
 * 18. Administrator выбирает одиночный тип группы.
 * 19. Administrator добавляет вариант добавки.
 * 20. Administrator указывает название добавки.
 * 21. Administrator устанавливает нулевую цену добавки.
 * 22. Administrator выбирает добавку по умолчанию.
 * 23. Administrator сохраняет группу добавок.
 * 24. Administrator открывает назначения категории.
 * 25. Administrator выбирает группу добавок категории.
 * 26. Administrator сохраняет назначения категории.
 * 27. Customer открывает публичное меню.
 * 28. Customer открывает категорию.
 * 29. Customer открывает напиток.
 *
 * Ожидаемый результат:
 * - В публичном меню показаны созданные напиток, размер M, его цена и обязательная добавка.
 */
test("JOURNEY-01: administrator публикует напиток", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
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
    await menuManagement.productEditor.fillDescription(data.productDescription);
    await menuManagement.productEditor.setPrice(
      ProductEditorSize.M,
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
    await menuManagement.modifierGroupEditor.fillOptionName(data.modifierName);
    await menuManagement.modifierGroupEditor.setOptionPrice("0");
    await menuManagement.modifierGroupEditor.setOptionDefault();
    await menuManagement.modifierGroupEditor.save();
    await menuManagement.assignments.openCategory(data.categoryName);
    await menuManagement.assignments.selectGroup(data.modifierGroupName);
    await menuManagement.assignments.save();
    await backOfficeAuth.form.signOut();

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);
    await publicMenu.product.openProduct(data);

    await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
    await publicMenu.product.selectModifier(data.modifierName);

    await test.step("Результат: публичное меню показывает созданные напиток, размер, цену и обязательную добавку.", async () => {
      const [price, size, modifierName] = await Promise.all([
        publicMenu.product.readProductPrice(),
        publicMenu.product.readSelectedSize(),
        publicMenu.product.readSelectedRequiredModifier(data.modifierGroupName),
      ]);

      expect(size, "Выбран размер M.").toBe(ProductConfiguratorSize.M);
      expect(price, "Цена напитка показана.").toContain("1,99");
      expect(modifierName, "Обязательная добавка выбрана.").toBe(
        data.modifierName,
      );
    });
  } finally {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.catalog.expandCategory(data.categoryName);
    await menuManagement.productEditor.archive(data.productName);
    await menuManagement.modifierGroupEditor.archive(data.modifierGroupName);
    await menuManagement.categoryEditor.archive(data.categoryName);
    await menuManagement.catalog.assertScenarioAbsent(data);
  }
});
