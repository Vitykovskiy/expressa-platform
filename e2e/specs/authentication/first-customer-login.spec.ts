import { CustomerSessionState, expect, test } from "@fixtures/test";

/**
 * Назначение: новый клиент подтверждает номер телефона и получает доступ к публичному интерфейсу.
 *
 * Предусловия: тестовое окружение предоставляет номер нового клиента и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает российский номер телефона.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент указывает полученный шестизначный одноразовый код.
 * 5. Клиент подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Клиент становится авторизованным пользователем.
 * - Первый вход создаёт учётную запись клиента для указанного номера.
 * - Клиент возвращается в публичный интерфейс.
 */
test("AUTH-01: новый клиент входит по номеру телефона", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();

  await test.step("Клиент становится авторизованным пользователем", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });
  await test.step("Первый вход создаёт учётную запись клиента для указанного номера", async () => {
    await expect(
      await customerAuth.isAuthenticatedAccountVisible(
        e2eCredentials.customer.phone,
      ),
      "Учётная запись создана для указанного номера.",
    ).toBe(true);
  });
  await test.step("Клиент возвращается в публичный интерфейс", async () => {
    await expect(
      await customerAuth.isPublicInterfaceVisible(),
      "Публичный интерфейс открыт для авторизованного клиента.",
    ).toBe(true);
  });
});
