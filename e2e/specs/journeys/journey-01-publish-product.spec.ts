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
 * Назначение: администратор публикует напиток, доступный клиенту в публичном меню.
 *
 * Предусловия: в тестовом окружении доступны роли администратора и клиента с одноразовыми кодами; изолированный профиль предоставляет уникальный идентификатор сценария.
 *
 * Сценарий:
 * 1. Администратор открывает административное приложение.
 * 1.1. Администратор указывает номер телефона.
 * 1.2. Администратор запрашивает одноразовый код.
 * 1.3. Администратор указывает одноразовый код.
 * 1.4. Администратор подтверждает номер телефона.
 * 2. Администратор открывает управление меню.
 * 3. Администратор начинает создание категории.
 * 4. Администратор указывает название категории.
 * 5. Администратор указывает описание категории.
 * 6. Администратор сохраняет категорию.
 * 7. Администратор начинает создание напитка.
 * 8. Администратор выбирает категорию напитка.
 * 9. Администратор выбирает тип напитка.
 * 10. Администратор указывает название напитка.
 * 11. Администратор указывает описание напитка.
 * 12. Администратор оставляет единственный размер M.
 * 12.1. Администратор устанавливает цену размера M.
 * 13. Администратор сохраняет напиток.
 * 14. Администратор открывает управление группами добавок.
 * 15. Администратор начинает создание группы добавок.
 * 16. Администратор указывает название группы добавок.
 * 17. Администратор делает выбор обязательным.
 * 18. Администратор выбирает одиночный тип группы.
 * 19. Администратор добавляет вариант добавки.
 * 20. Администратор указывает название добавки.
 * 21. Администратор устанавливает нулевую цену добавки.
 * 22. Администратор выбирает добавку по умолчанию.
 * 23. Администратор сохраняет группу добавок.
 * 24. Администратор открывает назначения категории.
 * 25. Администратор выбирает группу добавок категории.
 * 26. Администратор сохраняет назначения категории.
 * 26.1. Администратор выходит из административного приложения.
 * 27. Клиент открывает публичное меню.
 * 28. Клиент открывает категорию.
 * 29. Клиент открывает напиток.
 * 30. Клиент выбирает размер M.
 *
 * Ожидаемый результат:
 * - Созданная категория открывает опубликованный напиток.
 * - Публичное меню показывает созданный напиток.
 * - Обязательная добавка выбрана по умолчанию.
 * - Карточка напитка содержит размер M.
 * - Цена напитка соответствует опубликованной.
 */
test("JOURNEY-01: администратор публикует напиток", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
  await backOfficeAuth.form.confirmCode();
  await menuManagement.open();
  await menuManagement.categoryEditor.startCreation();
  await menuManagement.categoryEditor.fillName(data.categoryName);
  await menuManagement.categoryEditor.fillDescription(data.productDescription);
  await menuManagement.categoryEditor.save(data.categoryName);
  await menuManagement.productEditor.startCreation();
  await menuManagement.productEditor.selectCategory(data.categoryName);
  await menuManagement.productEditor.selectType(ProductType.DRINK);
  await menuManagement.productEditor.fillName(data.productName);
  await menuManagement.productEditor.fillDescription(data.productDescription);
  await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
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
  await test.step("Результат: созданная категория открывает опубликованный напиток.", async () => {
    expect(
      await publicMenu.product.isProductVisible(data.productName),
      "Созданный напиток показан в категории.",
    ).toBe(true);
  });
  await publicMenu.product.openProduct(data);

  await test.step("Результат: публичное меню показывает созданный напиток.", async () => {
    expect(
      await publicMenu.product.readOpenedProductTitle(),
      "Открыт созданный напиток.",
    ).toBe(data.productName);
  });
  await test.step("Результат: обязательная добавка выбрана по умолчанию.", async () => {
    expect(
      await publicMenu.product.readSelectedRequiredModifier(
        data.modifierGroupName,
      ),
      "Обязательная добавка выбрана по умолчанию.",
    ).toBe(data.modifierName);
  });
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await test.step("Результат: карточка напитка содержит размер M.", async () => {
    expect(
      await publicMenu.product.readSelectedSize(),
      "Выбран размер M.",
    ).toBe(ProductConfiguratorSize.M);
  });
  await test.step("Результат: цена напитка соответствует опубликованной.", async () => {
    const price = await publicMenu.product.readProductPrice();

    expect(price, "Цена напитка показана.").toContain("1,99");
  });
});
