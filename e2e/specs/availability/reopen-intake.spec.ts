import {
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник открывает приём новых заказов, а customer может оформить корзину.
 *
 * Предусловия: administrator и customer могут авторизоваться в своих интерфейсах;
 * customer может добавить в корзину доступный капучино размера M; приём новых заказов закрыт.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник включает приём новых заказов.
 * 3. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Back-office показывает, что приём новых заказов открыт.
 * - Customer не видит сообщение о закрытом приёме новых заказов.
 * - Customer может выбрать оформление заказа.
 */
test("AVAIL-11: сотрудник возобновляет приём новых заказов", async ({
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
    await test.step("Подготовка: administrator публикует уникальную категорию и доступный капучино размера M, customer добавляет его в корзину, а administrator закрывает приём новых заказов.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория возобновления приёма заказов",
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
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.setIntake(
        AvailabilityState.UNAVAILABLE,
      );
    });

    await availabilityManagement.open();
    await availabilityManagement.list.setIntake(AvailabilityState.AVAILABLE);
    await test.step("Back-office показывает, что приём новых заказов открыт.", async () => {
      await availabilityManagement.list.assertIntakeAvailability(
        AvailabilityState.AVAILABLE,
      );
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await checkout.cart.open();

    await test.step("Customer не видит сообщение о закрытом приёме новых заказов.", async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Сообщение о закрытом приёме новых заказов не показано.",
      ).toBe(false);
    });
    await test.step("Customer может выбрать оформление заказа.", async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления заказа доступна.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator восстанавливает приём новых заказов и удаляет данные сценария.", async () => {
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
