import { BackOfficeWorkspaceSection, expect, test } from "@fixtures/test";

/**
 * Назначение: клиент не получает доступ к рабочим разделам back-office.
 *
 * Предусловия: тестовое окружение предоставляет номер клиента и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа back-office.
 * 2. Клиент указывает свой номер телефона.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент указывает полученный шестизначный одноразовый код.
 * 5. Клиент подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Клиент видит отказ в доступе к back-office.
 * - Клиент не получает доступ к очереди, доступности или меню back-office.
 */
test("AUTH-09 — Клиент получает отказ во входе в back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.customer.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.customer.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Клиент видит отказ в доступе к back-office", async () => {
    await expect(
      await backOfficeAuth.form.isAccessDeniedVisible(),
      "Клиент видит отказ в доступе к back-office.",
    ).toBe(true);
  });

  await test.step("Клиент не получает доступ к очереди, доступности или меню back-office", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь недоступна клиенту.",
    ).toBe(false);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность недоступна клиенту.",
    ).toBe(false);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.MENU,
      ),
      "Меню недоступно клиенту.",
    ).toBe(false);
  });
});
