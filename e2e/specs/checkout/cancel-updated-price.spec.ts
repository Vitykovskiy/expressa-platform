import {
  expectedResult,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer не подтверждает оформление после изменения итога.
 *
 * Предусловия: изолированный профиль `canonical` предоставляет «Капучино» с
 * ценой размера M 320 ₽; корзина нового browser context пуста.
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
 * 10. Administrator устанавливает цену размера M 300 ₽.
 * 11. Administrator сохраняет изменение товара.
 * 12. Customer открывает публичное меню.
 * 13. Customer открывает корзину.
 * 14. Customer выбирает оформление заказа.
 * 15. Customer открывает меню без подтверждения нового итога.
 *
 * Ожидаемый результат:
 * - Корзина показывает прежний итог 320 ₽ и новый итог 300 ₽.
 * - Customer видит запрос на подтверждение нового итога.
 * - Заказ не создаётся без подтверждения нового итога.
 */
test("CHECKOUT-04: customer отменяет оформление после изменения цены", async ({
  page,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  multiSession,
  orderHistory,
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
  await orderHistory.open();
  const ordersBefore = await orderHistory.history.readOrderCount();
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
  await publicMenu.product.selectModifier("Обычное молоко");
  await publicMenu.product.addToCart();
  await test.step("Подготовка: administrator авторизуется", async () => {
    await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
    await multiSession.staff.auth.form.signIn(e2eCredentials.administrator);
  });
  await multiSession.staff.menuManagement.open();
  await multiSession.staff.menuManagement.catalog.expandCategory("Кофе");
  await multiSession.staff.menuManagement.productEditor.openForEditing(
    "Капучино",
  );
  await multiSession.staff.menuManagement.productEditor.setPrice(
    ProductEditorSize.M,
    "300",
  );
  await multiSession.staff.menuManagement.productEditor.saveChanges("Капучино");
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();
  await checkout.cart.requestUpdatedTotalConfirmation();

  await expectedResult(
    "Корзина показывает прежний итог 320 ₽ и новый итог 300 ₽.",
    page,
    async () => {
      const totals = await checkout.cart.readUpdatedTotals();

      expect(totals.previousTotal, "Показан прежний итог 320 ₽.").toBe("320 ₽");
      expect(totals.newTotal, "Показан новый итог 300 ₽.").toBe("300 ₽");
    },
  );
  await expectedResult(
    "Customer видит запрос на подтверждение нового итога.",
    page,
    async () => {
      expect(
        await checkout.cart.isUpdatedTotalConfirmationVisible(),
        "Кнопка подтверждения нового итога показана.",
      ).toBe(true);
    },
  );
  await checkout.navigation.openMenu();
  await orderHistory.open();
  await expectedResult(
    "Заказ не создаётся без подтверждения нового итога.",
    page,
    async () => {
      expect(
        await orderHistory.history.readOrderCount(),
        "Количество заказов не изменилось без подтверждения нового итога.",
      ).toBe(ordersBefore);
    },
  );
});
