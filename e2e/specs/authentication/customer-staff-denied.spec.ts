import { BackOfficeWorkspaceSection, expect, test } from "@fixtures/test";

/**
 * Назначение: customer не получает доступ к рабочим разделам back-office.
 *
 * Предусловия: для номера customer существует пользователь с ролью customer;
 * customer может получить одноразовый код для этого номера.
 *
 * Сценарий:
 * 1. Customer открывает форму входа back-office.
 * 2. Customer указывает свой номер телефона.
 * 3. Customer запрашивает одноразовый код.
 * 4. Customer указывает полученный шестизначный одноразовый код.
 * 5. Customer подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer видит отказ в доступе к back-office.
 * - Customer не получает доступ к очереди, доступности или меню back-office.
 */
test("AUTH-09 — Customer получает отказ во входе в back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.customer.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.customer.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Customer видит отказ в доступе к back-office", async () => {
    await expect(
      await backOfficeAuth.form.isAccessDeniedVisible(),
      "Customer видит отказ в доступе к back-office.",
    ).toBe(true);
  });

  await test.step("Customer не получает доступ к очереди, доступности или меню back-office", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь недоступна customer.",
    ).toBe(false);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность недоступна customer.",
    ).toBe(false);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.MENU,
      ),
      "Меню недоступно customer.",
    ).toBe(false);
  });
});
