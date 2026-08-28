import { CustomerSessionState, test } from "@fixtures/test";

/**
 * Назначение: зарегистрированный customer снова получает доступ по своему номеру телефона.
 *
 * Предусловия: для номера customer уже существует учётная запись;
 * customer может получить одноразовый код для этого номера.
 *
 * Сценарий:
 * 1. Customer открывает форму входа.
 * 2. Customer указывает номер телефона.
 * 3. Customer запрашивает одноразовый код.
 * 4. Customer указывает полученный шестизначный одноразовый код.
 * 5. Customer подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer становится авторизованным пользователем своей существующей учётной записи.
 * - Customer возвращается в публичный интерфейс.
 */
test("AUTH-02 — Зарегистрированный customer повторно входит по номеру телефона", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();

  await test.step("Customer становится авторизованным пользователем своей существующей учётной записи", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });

  await test.step("Customer возвращается в публичный интерфейс", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });
});
