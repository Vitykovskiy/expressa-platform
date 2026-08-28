import {
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник закрывает приём новых заказов, сохраняя customer доступ к меню.
 *
 * Предусловия: administrator и customer могут авторизоваться в своих интерфейсах;
 * customer может добавить в корзину доступный капучино размера M.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает приём новых заказов.
 * 3. Customer открывает публичное меню.
 * 4. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Back-office показывает, что приём новых заказов остановлен.
 * - Customer видит публичное меню.
 * - Customer видит сообщение о закрытом приёме новых заказов.
 * - Customer не может выбрать оформление заказа.
 */
test("AVAIL-05: сотрудник закрывает приём новых заказов", async ({
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Кофе ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует уникальную категорию и доступный капучино размера M.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория закрытого приёма заказов",
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

    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await availabilityManagement.open();
    await availabilityManagement.list.setIntake(AvailabilityState.UNAVAILABLE);
    await test.step("Back-office показывает, что приём новых заказов остановлен.", async () => {
      await availabilityManagement.list.assertIntakeAvailability(
        AvailabilityState.UNAVAILABLE,
      );
    });

    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await checkout.cart.open();

    await test.step("Customer видит публичное меню.", async () => {
      expect(
        await publicMenu.product.isProductVisible(productName),
        "Доступный капучино показан в публичном меню.",
      ).toBe(true);
    });
    await test.step("Customer видит сообщение о закрытом приёме новых заказов.", async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Показано сообщение о закрытом приёме новых заказов.",
      ).toBe(true);
    });
    await test.step("Customer не может выбрать оформление заказа.", async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления заказа недоступна.",
      ).toBe(false);
    });
  } finally {
    await test.step("Очистка: administrator открывает приём новых заказов и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(AvailabilityState.AVAILABLE);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
