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
 * Назначение: товары с разными наборами добавок остаются отдельными позициями корзины.
 *
 * Предусловия: в публичном меню есть опубликованный напиток с доступной необязательной добавкой; корзина customer пуста.
 *
 * Сценарий:
 * 1. Customer открывает напиток в публичном меню.
 * 2. Customer добавляет напиток с исходной конфигурацией в корзину.
 * 3. Customer добавляет к напитку необязательную добавку.
 * 4. Customer добавляет изменённую конфигурацию в корзину.
 * 5. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показаны две отдельные позиции одного напитка.
 * - Каждая позиция показывает собственный набор добавок, количество и стоимость.
 * - Итог корзины равен сумме обеих позиций.
 */
test("CART-03: customer видит раздельные конфигурации", async ({
  backOfficeAuth,
  checkout,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const rubleFormatter = new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  });
  try {
    await test.step("Подготовка: administrator публикует напиток с необязательной добавкой.", async () => {
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
      await menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(
        data.modifierName,
      );
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(data.categoryName);
      await menuManagement.assignments.selectGroup(data.modifierGroupName);
      await menuManagement.assignments.save();
      await backOfficeAuth.form.signOut();
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);
    await publicMenu.product.openProduct(data.productName);
    await publicMenu.product.addToCart();
    await publicMenu.product.openProduct(data.productName);
    await publicMenu.product.selectModifier(data.modifierName);
    await publicMenu.product.addToCart();
    await checkout.cart.open();
    await test.step("В корзине показаны две отдельные позиции одного напитка.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показаны две отдельные позиции.",
      ).toBe(2);
      expect(
        await checkout.cart.readItemNames(),
        "Обе позиции относятся к одному напитку.",
      ).toEqual([data.productName, data.productName]);
    });
    await test.step("Каждая позиция показывает собственный набор добавок, количество и стоимость.", async () => {
      const expectedConfigurationPrice = rubleFormatter.format(
        Number(data.productPrice) / 100,
      );
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Первая позиция не содержит необязательную добавку.",
      ).toEqual([]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Количество первой позиции равно одному.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Для первой позиции показана стоимость.",
      ).toBe(expectedConfigurationPrice);
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Вторая позиция содержит необязательную добавку.",
      ).toEqual([`+ ${data.modifierName}`]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Количество второй позиции равно одному.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.M,
          [data.modifierName],
        ),
        "Для второй позиции показана стоимость.",
      ).toBe(expectedConfigurationPrice);
    });
    await test.step("Итог корзины равен сумме обеих позиций.", async () => {
      const expectedCartTotal = rubleFormatter.format(
        (Number(data.productPrice) * 2) / 100,
      );
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины равен сумме стоимостей обеих позиций.",
      ).toBe(expectedCartTotal);
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
      await backOfficeAuth.form.signOut();
    });
  }
});
