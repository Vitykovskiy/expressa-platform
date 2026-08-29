import { expect, test } from "@fixtures/test";

/**
 * Назначение: customer не открывает заказ другого customer.
 *
 * Предусловия: изолированный профиль `customer-history` содержит выданный заказ второго customer №20300102-022; customer может войти через UI.
 *
 * Сценарий:
 * 1. Customer открывает ссылку на заказ второго customer.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение о недоступности чужого заказа.
 * - Customer не видит состав, сумму и стадию чужого заказа.
 */
test("ORDER-02: customer не открывает чужой заказ", async ({
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
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

  await customerOrder.open(
    e2eEnvironment.frontOfficeUrl,
    "00000000-0000-4000-8000-000000000022",
  );

  await test.step("Customer видит сообщение о недоступности чужого заказа.", async () => {
    expect(
      await customerOrder.details.isUnavailableMessageVisible(),
      "Показано сообщение о недоступности чужого заказа.",
    ).toBe(true);
  });
  await test.step("Customer не видит состав, сумму и стадию чужого заказа.", async () => {
    expect(
      await customerOrder.details.areItemsAbsent(),
      "Состав не показан.",
    ).toBe(true);
    expect(
      await customerOrder.details.isTotalAbsent(),
      "Сумма не показана.",
    ).toBe(true);
    expect(
      await customerOrder.details.areStatusesAbsent(),
      "Стадия не показана.",
    ).toBe(true);
  });
});
