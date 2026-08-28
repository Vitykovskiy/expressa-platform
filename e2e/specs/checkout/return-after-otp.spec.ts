import {
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: гость подтверждает номер и возвращается к сохранённой корзине.
 *
 * Предусловия: гость добавил в корзину один доступный капучино размера M стоимостью 250 ₽; приём новых заказов открыт; гость может получить одноразовый код для номера `+7 999 123-45-67`.
 *
 * Сценарий:
 * 1. Гость открывает корзину.
 * 2. Гость выбирает оформление заказа.
 * 3. Гость указывает номер телефона `+7 999 123-45-67`.
 * 4. Гость запрашивает одноразовый код.
 * 5. Гость указывает полученный шестизначный одноразовый код.
 * 6. Гость подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer возвращается к корзине после подтверждения номера.
 * - Корзина содержит добавленный до входа капучино размера M.
 * - Корзина показывает количество один и итог 250 ₽.
 * - Customer может продолжить оформление заказа.
 */
test("CHECKOUT-02: гость возвращается к оформлению после OTP", async ({
  backOfficeAuth,
  checkout,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const productName = data.productName.replace("Напиток", "Капучино");

  try {
    await test.step("Подготовка: administrator публикует доступный капучино размера M стоимостью 250 ₽.", async () => {
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
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.save(productName);
      await backOfficeAuth.form.signOut();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.addToCart();
    });

    await checkout.cart.open();
    await checkout.cart.startCheckout();
    await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
    await checkout.phoneVerification.requestCode();
    await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await checkout.phoneVerification.confirm();

    await test.step("Customer возвращается к корзине после подтверждения номера.", async () => {
      expect(
        await checkout.isCartOpen(),
        "После подтверждения номера снова открыта корзина.",
      ).toBe(true);
    });

    await test.step("Корзина содержит добавленный до входа капучино размера M.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показана одна добавленная до входа позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В корзине сохранён добавленный до входа капучино.",
      ).toBe(productName);
      expect(
        await checkout.cart.readItemVariant(
          productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "В корзине сохранён размер M.",
      ).toBe("Размер M");
    });

    await test.step("Корзина показывает количество один и итог 250 ₽.", async () => {
      const expectedTotal = new Intl.NumberFormat("ru-RU", {
        currency: "RUB",
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        style: "currency",
      }).format(250);

      expect(
        await checkout.cart.readItemQuantity(
          productName,
          ProductConfiguratorSize.M,
          [],
        ),
        "Для капучино показано количество один.",
      ).toBe(1);
      expect(
        await checkout.cart.readTotal(),
        "Для корзины показан итог 250 ₽.",
      ).toBe(expectedTotal);
    });

    await test.step("Customer может продолжить оформление заказа.", async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления заказа доступна после подтверждения номера.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категорию и товар.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
