import {
  BackOfficeWorkspaceSection,
  CustomerSessionState,
  expect,
  test,
} from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer и administrator сохраняют независимые сессии в одном браузере.
 *
 * Предусловия: тестовое окружение предоставляет разные customer и administrator номера
 * и отдельные origin customer/back-office с same-origin API proxy.
 *
 * Сценарий:
 * 1. Customer открывает публичный интерфейс.
 * 2. Customer указывает номер телефона.
 * 3. Customer запрашивает одноразовый код.
 * 4. Customer указывает одноразовый код.
 * 5. Customer подтверждает одноразовый код.
 * 6. Administrator открывает back-office в том же браузере.
 * 7. Administrator указывает номер телефона.
 * 8. Administrator запрашивает одноразовый код.
 * 9. Administrator указывает одноразовый код.
 * 10. Administrator подтверждает одноразовый код.
 * 11. Customer перезагружает публичный интерфейс.
 * 12. Administrator перезагружает back-office.
 * 13. Administrator выходит из учётной записи.
 * 14. Customer перезагружает публичный интерфейс.
 * 15. Второй administrator открывает back-office в том же браузере.
 * 16. Второй administrator указывает номер телефона.
 * 17. Второй administrator запрашивает одноразовый код.
 * 18. Второй administrator указывает одноразовый код.
 * 19. Второй administrator подтверждает одноразовый код.
 * 20. Customer выходит из учётной записи.
 * 21. Второй administrator перезагружает back-office.
 *
 * Ожидаемый результат:
 * - Customer и administrator авторизованы одновременно в разных origin одного браузера.
 * - Перезагрузка каждого интерфейса восстанавливает только его сессию.
 * - Выход administrator не завершает сессию customer, а выход customer не завершает сессию administrator.
 */
test("AUTH-10 — Customer и administrator изолированы в одном браузере", async ({
  e2eCredentials,
  e2eEnvironment,
  sameBrowserSessions,
}) => {
  const { customer, administrator } = sameBrowserSessions;
  const { secondAdministrator } = sameBrowserSessions;

  await customer.auth.open(e2eEnvironment.frontOfficeUrl);
  await customer.auth.phoneVerification.fillPhone(
    e2eCredentials.customer.phone,
  );
  await customer.auth.phoneVerification.requestCode();
  await customer.auth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customer.auth.phoneVerification.confirm();

  await administrator.auth.open(e2eEnvironment.backOfficeUrl);
  await administrator.auth.form.fillPhone(e2eCredentials.administrator.phone);
  await administrator.auth.form.requestCode();
  await administrator.auth.form.fillCode(e2eCredentials.administrator.otp);
  await administrator.auth.form.confirmCode();

  await expectedResult(
    "Customer и administrator авторизованы одновременно в разных origin одного браузера",
    customer.page,
    async () => {
      expect(new URL(e2eEnvironment.frontOfficeUrl).origin).not.toBe(
        new URL(e2eEnvironment.backOfficeUrl).origin,
      );
      await customer.auth.assertSession(CustomerSessionState.AUTHENTICATED);
      await expect(
        await administrator.auth.isWorkspaceSectionVisible(
          BackOfficeWorkspaceSection.QUEUE,
        ),
        "Очередь доступна авторизованному administrator.",
      ).toBe(true);
    },
  );

  await customer.auth.reload();
  await administrator.auth.reload();

  await expectedResult(
    "Перезагрузка каждого интерфейса восстанавливает только его сессию",
    customer.page,
    async () => {
      await customer.auth.assertSession(CustomerSessionState.AUTHENTICATED);
      await expect(
        await administrator.auth.isWorkspaceSectionVisible(
          BackOfficeWorkspaceSection.QUEUE,
        ),
        "Очередь сохранена после перезагрузки back-office.",
      ).toBe(true);
    },
  );

  await administrator.auth.form.signOut();
  await customer.auth.reload();

  await expectedResult(
    "Выход administrator не завершает сессию customer",
    customer.page,
    async () => {
      await customer.auth.assertSession(CustomerSessionState.AUTHENTICATED);
    },
  );

  await secondAdministrator.auth.open(e2eEnvironment.backOfficeUrl);
  await secondAdministrator.auth.form.fillPhone(
    e2eCredentials.secondAdministrator.phone,
  );
  await secondAdministrator.auth.form.requestCode();
  await secondAdministrator.auth.form.fillCode(
    e2eCredentials.secondAdministrator.otp,
  );
  await secondAdministrator.auth.form.confirmCode();
  await customer.auth.signOut();
  await secondAdministrator.auth.reload();

  await expectedResult(
    "Выход customer не завершает сессию administrator",
    secondAdministrator.page,
    async () => {
      await customer.auth.assertSession(CustomerSessionState.GUEST);
      await expect(
        await secondAdministrator.auth.isWorkspaceSectionVisible(
          BackOfficeWorkspaceSection.QUEUE,
        ),
        "Очередь второго administrator доступна после выхода customer.",
      ).toBe(true);
    },
  );
});
