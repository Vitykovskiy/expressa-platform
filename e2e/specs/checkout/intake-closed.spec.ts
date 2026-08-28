import {
  AvailabilityState,
  createProductOrderScenarioData,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer видит, что новые заказы временно не принимаются.
 *
 * Предусловия: customer авторизован; в корзине есть доступный капучино размера M стоимостью 250 ₽; приём новых заказов закрыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение о закрытом приёме новых заказов.
 * - Customer не может выбрать оформление заказа.
 * - Заказ не создаётся.
 */
test("CHECKOUT-06: customer видит закрытый приём заказов", async ({
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  orderHistory,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  const productName = `Капучино ${testInfo.testId}`;
  let ordersBefore = 0;

  try {
    await test.step("Подготовка: administrator публикует доступный капучино размера M стоимостью 250 ₽, customer авторизуется и добавляет его в корзину.", async () => {
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
      ordersBefore = await orderHistory.history.readOrderCount();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(productName);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.addToCart();
    });
    await test.step("Подготовка: administrator закрывает приём новых заказов через интерфейс управления доступностью.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await checkout.cart.open();

    await test.step("Customer видит сообщение о закрытом приёме новых заказов.", async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Показано сообщение о временно закрытом приёме заказов.",
      ).toBe(true);
    });
    await test.step("Customer не может выбрать оформление заказа.", async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления заказа недоступна.",
      ).toBe(false);
    });

    await orderHistory.open();
    await test.step("Заказ не создаётся.", async () => {
      expect(
        await orderHistory.history.readOrderCount(),
        "Количество заказов не изменилось при закрытом приёме.",
      ).toBe(ordersBefore);
    });
  } finally {
    await test.step("Очистка: administrator открывает приём заказов и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(AvailabilityState.AVAILABLE);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
