import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer сохраняет корзину после перезагрузки страницы и успешного входа.
 *
 * Предусловия: в публичном меню есть опубликованный доступный товар; customer не авторизован.
 *
 * Сценарий:
 * 1. Customer открывает товар в публичном меню.
 * 2. Customer добавляет товар в корзину.
 * 3. Customer перезагружает страницу.
 * 4. Customer открывает корзину.
 * 5. Customer начинает оформление заказа.
 * 6. Customer вводит номер телефона.
 * 7. Customer запрашивает одноразовый код.
 * 8. Customer вводит полученный одноразовый код.
 * 9. Customer подтверждает номер телефона.
 *
 * Ожидаемый результат:
 * - После перезагрузки корзина содержит добавленную позицию с прежними конфигурацией и количеством.
 * - После успешного входа customer возвращается к корзине с той же позицией.
 */
test("CART-06: customer сохраняет корзину после перезагрузки и входа", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
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
    await test.step("Подготовка UI: customer открывает категорию публичного меню.", async () => {
      await publicMenu.product.openCategory(data.categoryName);
    });
    await publicMenu.product.openProduct(data.productName);
    await publicMenu.product.addToCart();
    await customerAuth.reload();
    await checkout.cart.open();

    await test.step("После перезагрузки корзина содержит добавленную позицию с прежними конфигурацией и количеством.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "После перезагрузки в корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После перезагрузки сохранено наименование позиции.",
      ).toBe(data.productName);
      expect(
        await checkout.cart.readItemVariant(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После перезагрузки сохранён выбранный вариант.",
      ).toBe("Размер M");
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После перезагрузки сохранён набор добавок.",
      ).toEqual([]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После перезагрузки сохранено количество позиции.",
      ).toBe(1);
    });

    await checkout.cart.startCheckout();
    await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
    await checkout.phoneVerification.requestCode();
    await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await checkout.phoneVerification.confirm();

    await test.step("После успешного входа customer возвращается к корзине с той же позицией.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "После входа в корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После входа сохранено наименование позиции.",
      ).toBe(data.productName);
      expect(
        await checkout.cart.readItemVariant(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После входа сохранён выбранный вариант.",
      ).toBe("Размер M");
      expect(
        await checkout.cart.readItemModifiers(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После входа сохранён набор добавок.",
      ).toEqual([]);
      expect(
        await checkout.cart.readItemQuantity(
          data.productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "После входа сохранено количество позиции.",
      ).toBe(1);
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
