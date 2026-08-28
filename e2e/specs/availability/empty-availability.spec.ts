import { expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит понятное состояние при отсутствии позиций для управления.
 *
 * Предусловия: barista авторизован в back-office; в профиле E2E `empty` в меню нет активных категорий с позициями для управления.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 *
 * Ожидаемый результат:
 * - Сотрудник видит сообщение «Меню пусто».
 * - Сотрудник видит пояснение, что позиции появятся после добавления в меню.
 */
test("AVAIL-12: сотрудник видит пустое состояние доступности", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Предусловие: barista входит в back-office.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
  });
  await availabilityManagement.open();

  await test.step("Сотрудник видит сообщение «Меню пусто».", async () => {
    expect(
      await availabilityManagement.list.isEmptyVisible(),
      "Сообщение «Меню пусто» показано.",
    ).toBe(true);
  });
  await test.step("Сотрудник видит пояснение, что позиции появятся после добавления в меню.", async () => {
    expect(
      await availabilityManagement.list.isEmptyDescriptionVisible(),
      "Пояснение о появлении позиций после добавления в меню показано.",
    ).toBe(true);
  });
});
