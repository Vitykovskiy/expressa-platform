import { CustomerSessionState, expect, test } from "@fixtures/test";

/**
 * Назначение: зарегистрированный клиент снова получает доступ по своему номеру телефона.
 *
 * Предусловия: seed-сценарий `customer-existing` предоставляет существующую вторую учётную запись customer и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает номер существующей второй учётной записи.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент указывает полученный одноразовый код.
 * 5. Клиент подтверждает одноразовый код.
 * 6. Клиент выходит из учётной записи.
 * 7. Клиент открывает форму входа повторно.
 * 8. Клиент указывает номер своей существующей учётной записи.
 * 9. Клиент запрашивает одноразовый код.
 * 10. Клиент указывает полученный одноразовый код.
 * 11. Клиент подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Клиент становится авторизованным пользователем своей существующей учётной записи.
 * - Клиент возвращается в публичный интерфейс.
 */
test("AUTH-02 — Зарегистрированный клиент повторно входит по номеру телефона", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(
    e2eCredentials.secondCustomer.phone,
  );
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(
    e2eCredentials.secondCustomer.otp,
  );
  await customerAuth.phoneVerification.confirm();
  await customerAuth.signOut();

  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(
    e2eCredentials.secondCustomer.phone,
  );
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(
    e2eCredentials.secondCustomer.otp,
  );
  await customerAuth.phoneVerification.confirm();

  await test.step("Клиент становится авторизованным пользователем своей существующей учётной записи", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });

  await test.step("Клиент возвращается в публичный интерфейс", async () => {
    await expect(
      await customerAuth.isPublicInterfaceVisible(),
      "Публичный интерфейс открыт для авторизованного клиента.",
    ).toBe(true);
  });
});
