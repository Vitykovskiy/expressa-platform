import { CustomerSessionState, expect, test } from "@fixtures/test";

/**
 * Назначение: новый customer подтверждает номер телефона и получает доступ к публичному интерфейсу.
 *
 * Предусловия: выбранный номер customer ещё не использовался; customer может получить одноразовый код.
 *
 * Сценарий:
 * 1. Customer открывает форму входа.
 * 2. Customer указывает российский номер телефона.
 * 3. Customer запрашивает одноразовый код.
 * 4. Customer указывает полученный шестизначный одноразовый код.
 * 5. Customer подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer становится авторизованным пользователем.
 * - Первый вход создаёт учётную запись customer для указанного номера.
 * - Customer возвращается в публичный интерфейс.
 */
test("AUTH-01: новый customer входит по номеру телефона", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();

  await test.step("Customer становится авторизованным пользователем.", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });
  await test.step("Первый вход создаёт учётную запись customer для указанного номера.", async () => {
    expect(
      await customerAuth.isAuthenticatedAccountVisible(
        e2eCredentials.customer.phone,
      ),
      "Учётная запись создана для указанного номера.",
    ).toBe(true);
  });
  await test.step("Customer возвращается в публичный интерфейс.", async () => {
    expect(
      await customerAuth.isPublicInterfaceVisible(),
      "Публичный интерфейс открыт для авторизованного customer.",
    ).toBe(true);
  });
});
