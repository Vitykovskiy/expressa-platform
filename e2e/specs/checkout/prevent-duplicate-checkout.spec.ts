import {
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не получает второй заказ при повторном действии оформления.
 *
 * Предусловия: customer авторизован; в корзине есть один доступный капучино размера M стоимостью 250 ₽; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer дважды выбирает оформление заказа до показа результата.
 *
 * Ожидаемый результат:
 * - Customer видит страницу одного созданного заказа.
 * - В созданном заказе один капучино размера M.
 * - Двойное действие не создаёт второй заказ.
 */
test("CHECKOUT-07: customer не получает второй заказ при повторном оформлении", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  orderHistory,
  publicMenu,
}, testInfo) => {
  const categoryName = `Категория повторного оформления ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;
  let ordersBefore = 0;

  try {
    await test.step("Подготовка: administrator публикует доступный капучино размера M стоимостью 250 ₽, а customer авторизуется и добавляет его в корзину.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория защиты от повторного оформления",
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
      await orderHistory.open();
      await test.step("Подготовка: customer ожидает загрузку истории заказов.", async () => {
        await orderHistory.history.waitUntilLoaded();
        ordersBefore = await orderHistory.history.readOrderCount();
      });
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(categoryName);
      await publicMenu.product.openProduct(productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.addToCart();
    });

    await checkout.cart.open();
    await checkout.cart.placeOrderTwice();

    await test.step("Customer видит страницу одного созданного заказа.", async () => {
      const order = await customerOrder.details.readReference();

      expect(
        order.id,
        "Страница показывает идентификатор созданного заказа.",
      ).toMatch(/^[0-9a-f-]{36}$/u);
      expect(
        order.number,
        "Страница показывает номер созданного заказа.",
      ).toMatch(/^\d+$/u);
    });
    await test.step("В созданном заказе один капучино размера M.", async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(
        await customerOrder.details.readItemsCount(),
        "В заказе одна позиция.",
      ).toBe(1);
      expect(order.productName, "В заказе указан капучино.").toBe(productName);
      expect(order.size, "В заказе указан размер M.").toBe(
        ProductConfiguratorSize.M,
      );
    });

    await orderHistory.open();
    await test.step("Двойное действие не создаёт второй заказ.", async () => {
      await orderHistory.history.waitUntilLoaded();
      expect(
        await orderHistory.history.readOrderCount(),
        "В истории появился только один новый заказ.",
      ).toBe(ordersBefore + 1);
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
