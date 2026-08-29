import { CustomerSessionState, test } from "@fixtures/test";

/**
 * Назначение: клиент сохраняет вход после перезагрузки и может явно завершить сессию.
 *
 * Предусловия: тестовое окружение предоставляет номер клиента и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает номер телефона.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент указывает одноразовый код.
 * 5. Клиент подтверждает одноразовый код.
 * 6. Клиент перезагружает публичный интерфейс.
 * 7. Клиент выходит из учётной записи.
 *
 * Ожидаемый результат:
 * - После перезагрузки клиент остаётся авторизованным.
 * - После выхода клиент возвращается на главную страницу как гость.
 */
test("AUTH-07 — Клиент восстанавливает и завершает сессию", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();

  await customerAuth.reload();

  await test.step("После перезагрузки клиент остаётся авторизованным", async () => {
    await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
  });

  await customerAuth.signOut();

  await test.step("После выхода клиент возвращается на главную страницу как гость", async () => {
    await customerAuth.assertSession(CustomerSessionState.GUEST);
  });
});
