import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить, что категория не сохраняется без обязательного названия.
 *
 * Предусловия: administrator авторизован.
 *
 * Сценарий:
 * 1. Administrator нажимает «Добавить группу».
 * 2. Administrator очищает название категории.
 *
 * Ожидаемый результат:
 * - Administrator видит сообщение «Введите название категории».
 * - Действие сохранения категории недоступно.
 */
test("CATALOG-03: administrator видит валидацию категории", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();

  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.clearName();

    await test.step("Administrator видит сообщение «Введите название категории».", async () => {
      expect(
        await menuManagement.categoryEditor.readNameValidation(),
        "Показано сообщение «Введите название категории».",
      ).toBe("Введите название категории");
    });
    await test.step("Действие сохранения категории недоступно.", async () => {
      expect(
        await menuManagement.categoryEditor.isCreateSaveAvailable(),
        "Действие сохранения категории недоступно.",
      ).toBe(false);
    });
  } finally {
    await backOfficeAuth.form.signOut();
  }
});
