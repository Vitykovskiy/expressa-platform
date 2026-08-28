import { BackOfficeWorkspaceSection, expect, test } from "@fixtures/test";

/**
 * Назначение: barista получает доступ к своим рабочим разделам back-office.
 *
 * Предусловия: для номера сотрудника существует пользователь с ролью barista;
 * сотрудник может получить одноразовый код для этого номера.
 *
 * Сценарий:
 * 1. Сотрудник открывает форму входа back-office.
 * 2. Сотрудник указывает свой номер телефона.
 * 3. Сотрудник запрашивает одноразовый код.
 * 4. Сотрудник указывает полученный шестизначный одноразовый код.
 * 5. Сотрудник подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Barista получает доступ к очереди и доступности.
 * - Сотрудник видит рабочий раздел back-office после входа.
 */
test("AUTH-08 — Barista входит в рабочие разделы back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Barista получает доступ к очереди и доступности", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь доступна barista.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность доступна barista.",
    ).toBe(true);
  });

  await test.step("Сотрудник видит рабочий раздел back-office после входа", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Рабочий раздел back-office виден сотруднику после входа.",
    ).toBe(true);
  });
});

/**
 * Назначение: administrator получает доступ к своим рабочим разделам back-office.
 *
 * Предусловия: для номера сотрудника существует пользователь с ролью administrator;
 * сотрудник может получить одноразовый код для этого номера.
 *
 * Сценарий:
 * 1. Сотрудник открывает форму входа back-office.
 * 2. Сотрудник указывает свой номер телефона.
 * 3. Сотрудник запрашивает одноразовый код.
 * 4. Сотрудник указывает полученный шестизначный одноразовый код.
 * 5. Сотрудник подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Administrator получает доступ к очереди, доступности и меню.
 * - Сотрудник видит рабочий раздел back-office после входа.
 */
test("AUTH-08 — Administrator входит в рабочие разделы back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Administrator получает доступ к очереди, доступности и меню", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь доступна administrator.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность доступна administrator.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.MENU,
      ),
      "Меню доступно administrator.",
    ).toBe(true);
  });

  await test.step("Сотрудник видит рабочий раздел back-office после входа", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Рабочий раздел back-office виден сотруднику после входа.",
    ).toBe(true);
  });
});
