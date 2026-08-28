import {
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не оформляет корзину с позицией, ставшей недоступной.
 *
 * Предусловия: customer авторизован; в корзине есть капучино размера M стоимостью 250 ₽; капучино размера M недоступен; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer выбирает оформление заказа.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение о недоступной позиции.
 * - Корзина выделяет недоступный капучино размера M.
 * - Customer не может оформить корзину, пока недоступная позиция не будет удалена.
 */
test("CHECKOUT-05: customer не оформляет корзину с недоступной позицией", async ({
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Категория недоступного оформления ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует доступный капучино размера M стоимостью 250 ₽, а customer авторизуется и добавляет его в корзину.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория недоступной позиции при оформлении",
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
    await test.step("Подготовка: administrator выключает добавленный капучино через интерфейс управления доступностью.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(productName);
      await availabilityManagement.list.setProductAvailability(
        productName,
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    });

    await checkout.cart.open();
    await checkout.cart.requestAvailabilityRevalidation();

    await test.step("Customer видит сообщение о недоступной позиции.", async () => {
      await checkout.cart.waitForUnavailableItemMessage(
        productName,
        ProductConfiguratorSize.M,
      );
      expect(
        await checkout.cart.isUnavailableItemMessageVisible(
          productName,
          ProductConfiguratorSize.M,
        ),
        "Сообщение о недоступности капучино показано.",
      ).toBe(true);
    });
    await test.step("Корзина выделяет недоступный капучино размера M.", async () => {
      expect(
        await checkout.cart.isItemUnavailable(
          productName,
          ProductConfiguratorSize.M,
        ),
        "Капучино связан с доступным для чтения сообщением о недоступности.",
      ).toBe(true);
    });
    await test.step("Customer не может оформить корзину, пока недоступная позиция не будет удалена.", async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Кнопка оформления недоступна.",
      ).toBe(false);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(productName);
      await availabilityManagement.list.setProductAvailability(
        productName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
