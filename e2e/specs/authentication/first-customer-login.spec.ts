import { CustomerSessionState, expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

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
  page,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirm();

  await expectedResult(
    "Клиент становится авторизованным пользователем",
    page,
    async () => {
      await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
    },
  );
  await expectedResult(
    "Первый вход создаёт учётную запись клиента для указанного номера",
    page,
    async () => {
      await expect(
        await customerAuth.isAuthenticatedAccountVisible(
          e2eCredentials.customer.phone,
        ),
        "Учётная запись создана для указанного номера.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Клиент возвращается в публичный интерфейс",
    page,
    async () => {
      await expect(
        await customerAuth.isPublicInterfaceVisible(),
        "Публичный интерфейс открыт для авторизованного клиента.",
      ).toBe(true);
    },
  );
});
