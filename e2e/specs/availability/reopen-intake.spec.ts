import {
  expectedResult,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник открывает приём новых заказов, а customer может оформить корзину.
 *
 * Предусловия: тестовое окружение предоставляет роли administrator и customer; seed-сценарий `intake-closed` предоставляет доступный «Капучино» размера M и закрытый приём заказов в изолированном запуске.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает товар «Капучино».
 * 4. Customer выбирает размер M.
 * 5. Customer добавляет товар в корзину.
 * 6. Сотрудник открывает раздел доступности.
 * 7. Сотрудник включает приём новых заказов.
 * 8. Customer открывает публичное меню.
 * 9. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - Back-office показывает, что приём новых заказов открыт.
 * - Customer не видит сообщение о закрытом приёме новых заказов.
 * - Customer может выбрать оформление заказа.
 */
test("AVAIL-11: сотрудник возобновляет приём новых заказов", async ({
  page,
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
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
  await publicMenu.product.addToCart();
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.setIntake(AvailabilityState.AVAILABLE);
  await expectedResult(
    "Back-office показывает, что приём новых заказов открыт.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.readIntakeAvailability(),
        "Приём новых заказов открыт.",
      ).toBe(AvailabilityState.AVAILABLE);
    },
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();
  await expectedResult(
    "Customer не видит сообщение о закрытом приёме новых заказов.",
    page,
    async () => {
      expect(
        await checkout.cart.isIntakeClosedVisible(),
        "Сообщение о закрытом приёме не показано.",
      ).toBe(false);
    },
  );
  await expectedResult(
    "Customer может выбрать оформление заказа.",
    page,
    async () => {
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Оформление доступно.",
      ).toBe(true);
    },
  );
});
