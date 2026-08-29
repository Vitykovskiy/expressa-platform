import {
  expect,
  OrderStatus,
  ProductConfiguratorSize,
  ProductEditorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer подтверждает новый итог после изменения цены.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет «Капучино» с
 * ценой размера M 320,00 ₽; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer выбирает добавку «Обычное молоко».
 * 6. Customer добавляет товар в корзину.
 * 7. Administrator открывает управление меню.
 * 8. Administrator раскрывает категорию «Кофе».
 * 9. Administrator открывает редактирование «Капучино».
 * 10. Administrator устанавливает цену размера M 300,00 ₽.
 * 11. Administrator сохраняет изменение товара.
 * 12. Customer открывает публичное меню.
 * 13. Customer открывает корзину.
 * 14. Customer выбирает оформление заказа.
 * 15. Customer подтверждает новый итог.
 *
 * Ожидаемый результат:
 * - Корзина показывает прежний итог 320,00 ₽ и новый итог 300,00 ₽.
 * - Customer видит запрос на подтверждение нового итога.
 * - Customer видит созданный заказ с итогом 300,00 ₽.
 */
test("CHECKOUT-03: customer подтверждает актуальную цену", async ({
  backOfficeAuth,
  checkout,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}) => {
  await test.step("Подготовка: customer авторизуется", async () => {
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
  });
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await publicMenu.product.selectModifier("Обычное молоко");
  await publicMenu.product.addToCart();
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.catalog.expandCategory("Кофе");
  await menuManagement.productEditor.openForEditing("Капучино");
  await menuManagement.productEditor.setPrice(ProductEditorSize.M, "30000");
  await menuManagement.productEditor.saveChanges("Капучино");
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();
  await checkout.cart.requestUpdatedTotalConfirmation();

  await test.step("Корзина показывает прежний итог 320,00 ₽ и новый итог 300,00 ₽.", async () => {
    const totals = await checkout.cart.readUpdatedTotals();

    expect(totals.previousTotal, "Показан прежний итог 320,00 ₽.").toBe(
      "320,00 ₽",
    );
    expect(totals.newTotal, "Показан новый итог 300,00 ₽.").toBe("300,00 ₽");
  });
  await test.step("Customer видит запрос на подтверждение нового итога.", async () => {
    expect(
      await checkout.cart.isUpdatedTotalConfirmationVisible(),
      "Кнопка подтверждения нового итога показана.",
    ).toBe(true);
  });
  await checkout.cart.confirmUpdatedTotal();
  await test.step("Customer видит созданный заказ с итогом 300,00 ₽.", async () => {
    const order = await customerOrder.details.readSnapshot();

    expect(order.status, "Заказ находится на стадии «Оформлен».").toBe(
      OrderStatus.CREATED,
    );
    expect(order.total, "Показан итог 300,00 ₽.").toBe("300,00 ₽");
  });
});
