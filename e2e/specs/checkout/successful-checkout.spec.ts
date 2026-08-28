import {
  expect,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: авторизованный customer оформляет подтверждённую корзину.
 *
 * Предусловия: customer авторизован; в корзине есть доступный капучино размера M стоимостью 250 ₽; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer выбирает оформление заказа.
 *
 * Ожидаемый результат:
 * - Customer видит страницу созданного заказа.
 * - Заказ имеет человекочитаемый номер и стадию «Оформлен».
 * - Страница показывает оплату на кассе при получении.
 * - Корзина customer очищается.
 */
test("CHECKOUT-01: авторизованный customer оформляет заказ", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Категория оформления ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует доступный капучино размера M стоимостью 250 ₽.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория успешного оформления",
      );
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.save(productName);
      await backOfficeAuth.form.signOut();
      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(categoryName);
      await publicMenu.product.openProduct(productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.addToCart();
    });

    await checkout.cart.open();
    await checkout.cart.placeOrder();

    await test.step("Customer видит страницу созданного заказа.", async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(
        order.id,
        "Страница показывает идентификатор созданного заказа.",
      ).toMatch(/^[0-9a-f-]{36}$/u);
    });
    await test.step("Заказ имеет человекочитаемый номер и стадию «Оформлен».", async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.number, "Заказ имеет человекочитаемый номер.").toMatch(
        /^\d+$/u,
      );
      expect(order.status, "Заказ находится на стадии «Оформлен».").toBe(
        OrderStatus.CREATED,
      );
    });
    await test.step("Страница показывает оплату на кассе при получении.", async () => {
      expect(
        await customerOrder.details.readPaymentMethod(),
        "Показан способ оплаты на кассе при получении.",
      ).toBe("Оплата на кассе при получении");
    });
    await test.step("Корзина customer очищается.", async () => {
      expect(
        await checkout.navigation.isCartEmpty(),
        "Глобальная навигация CustomerShell не показывает позиций в корзине.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные категорию и товар.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
