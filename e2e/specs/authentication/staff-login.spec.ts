import { BackOfficeWorkspaceSection, expect, test } from "@fixtures/test";

/**
 * Назначение: бариста получает доступ к своим рабочим разделам back-office.
 *
 * Предусловия: тестовое окружение предоставляет номер бариста и одноразовый код;
 * доступная роль бариста имеет права очереди и доступности.
 *
 * Сценарий:
 * 1. Бариста открывает форму входа back-office.
 * 2. Бариста указывает свой номер телефона.
 * 3. Бариста запрашивает одноразовый код.
 * 4. Бариста указывает полученный шестизначный одноразовый код.
 * 5. Бариста подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Бариста получает доступ к очереди и доступности.
 */
test("AUTH-08 — Бариста входит в рабочие разделы back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Бариста получает доступ к очереди и доступности", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь доступна бариста.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность доступна бариста.",
    ).toBe(true);
  });
});

/**
 * Назначение: администратор получает доступ к своим рабочим разделам back-office.
 *
 * Предусловия: тестовое окружение предоставляет номер администратора и одноразовый код;
 * доступная роль администратора имеет права очереди, доступности и меню.
 *
 * Сценарий:
 * 1. Администратор открывает форму входа back-office.
 * 2. Администратор указывает свой номер телефона.
 * 3. Администратор запрашивает одноразовый код.
 * 4. Администратор указывает полученный шестизначный одноразовый код.
 * 5. Администратор подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - Администратор получает доступ к очереди, доступности и меню.
 */
test("AUTH-08 — Администратор входит в рабочие разделы back-office", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
  await backOfficeAuth.form.requestCode();
  await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
  await backOfficeAuth.form.confirmCode();

  await test.step("Администратор получает доступ к очереди, доступности и меню", async () => {
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.QUEUE,
      ),
      "Очередь доступна администратору.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.AVAILABILITY,
      ),
      "Доступность доступна администратору.",
    ).toBe(true);
    await expect(
      await backOfficeAuth.isWorkspaceSectionVisible(
        BackOfficeWorkspaceSection.MENU,
      ),
      "Меню доступно администратору.",
    ).toBe(true);
  });
});
