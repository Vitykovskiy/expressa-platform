import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer удаляет позицию, а удаление последней позиции очищает корзину.
 *
 * Предусловия: в корзине customer есть две разные доступные позиции.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer удаляет первую позицию.
 * 3. Customer удаляет оставшуюся позицию.
 *
 * Ожидаемый результат:
 * - После первого удаления в корзине остаётся только вторая позиция с её стоимостью.
 * - После удаления последней позиции показано пустое состояние корзины.
 * - Customer может перейти из пустой корзины в меню.
 */
test("CART-05: customer удаляет позиции и очищает корзину", async ({
  backOfficeAuth,
  checkout,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  try {
    await test.step("Подготовка: administrator публикует напиток, а customer добавляет две разные позиции.", async () => {
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
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(data.productName);
      await publicMenu.product.addToCart();
      await publicMenu.product.openProduct(data.productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.S);
      await publicMenu.product.addToCart();
    });
    await checkout.cart.open();
    await checkout.cart.remove(data.productName, ProductConfiguratorSize.M);
    await test.step("После первого удаления в корзине остаётся только вторая позиция с её стоимостью.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине осталась только вторая позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.S,
          [],
        ),
        "Количество оставшейся позиции равно одному.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          data.productName,
          ProductConfiguratorSize.S,
          [],
        ),
        "Для оставшейся позиции показана стоимость.",
      ).not.toBe("0 ₽");
    });
    await checkout.cart.remove(data.productName, ProductConfiguratorSize.S);
    await test.step("После удаления последней позиции показано пустое состояние корзины.", async () => {
      expect(
        await checkout.cart.isEmptyStateVisible(),
        "Показано пустое состояние корзины.",
      ).toBe(true);
      expect(
        await checkout.cart.readItemsCount(),
        "Список позиций в корзине отсутствует.",
      ).toBe(0);
    });
    await checkout.cart.continueToMenu();
    await test.step("Customer может перейти из пустой корзины в меню.", async () => {
      expect(
        await publicMenu.readCategoryNames(),
        "После перехода из корзины показано меню с созданной категорией.",
      ).toContain(data.categoryName);
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
