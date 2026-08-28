import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer добавляет опубликованный товар с доступной исходной конфигурацией в корзину.
 *
 * Предусловия: в публичном меню есть опубликованный доступный товар с корректной исходной конфигурацией; корзина customer пуста.
 *
 * Сценарий:
 * 1. Customer открывает товар в публичном меню.
 * 2. Customer добавляет товар в корзину.
 * 3. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показана одна позиция с названием, выбранными вариантом и добавками, количеством и стоимостью.
 * - Количество товаров и итог корзины соответствуют добавленной позиции.
 */
test("CART-01: customer добавляет товар в корзину", async ({
  backOfficeAuth,
  checkout,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  try {
    await test.step("Подготовка: administrator публикует доступный напиток.", async () => {
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
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await publicMenu.product.openCategory(data.categoryName);
    await publicMenu.product.openProduct(data.productName);
    const configurationTotal =
      await publicMenu.product.readConfigurationTotal();
    await publicMenu.product.addToCart();
    await checkout.cart.open();

    await test.step("В корзине показана одна позиция с названием, выбранными вариантом и добавками, количеством и стоимостью.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Название позиции соответствует добавленному товару.",
      ).toBe(data.productName);
      expect(
        await checkout.cart.readItemVariant(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В позиции показан выбранный вариант.",
      ).toBe("Размер M");
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В позиции показан выбранный набор добавок.",
      ).toEqual([]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В позиции показано количество один.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В позиции показана стоимость выбранной конфигурации.",
      ).toBe(configurationTotal);
    });
    await test.step("Количество товаров и итог корзины соответствуют добавленной позиции.", async () => {
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Количество товаров соответствует добавленной позиции.",
      ).toBe(1);
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины соответствует стоимости добавленной позиции.",
      ).toBe(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
      );
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категорию и товар.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
