import { expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить, что категория не сохраняется без обязательного названия.
 *
 * Предусловия: изолированный профиль предоставляет доступную роль администратора.
 *
 * Сценарий:
 * 1. Администратор открывает управление меню.
 * 2. Администратор открывает создание категории.
 * 3. Администратор очищает название категории.
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение «Введите название категории».
 * - Действие сохранения категории недоступно.
 */
test("CATALOG-03: администратор видит валидацию категории", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}) => {
  await test.step("Подготовка: администратор авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  });
  await menuManagement.open();
  await menuManagement.categoryEditor.startCreation();
  await menuManagement.categoryEditor.clearName();

  await test.step("Администратор видит сообщение «Введите название категории».", async () => {
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
});
