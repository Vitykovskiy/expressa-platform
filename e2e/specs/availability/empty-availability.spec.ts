import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: сотрудник видит понятное состояние при отсутствии позиций для управления.
 *
 * Предусловия: тестовое окружение предоставляет роль barista; профиль `empty` без seed-данных не содержит активных категорий с позициями для управления.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 *
 * Ожидаемый результат:
 * - Сотрудник видит сообщение «Меню пусто».
 * - Сотрудник видит пояснение, что позиции появятся после добавления в меню.
 */
test("AVAIL-12: сотрудник видит пустое состояние доступности", async ({
  page,
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Подготовка: barista авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();

  await expectedResult(
    "Сотрудник видит сообщение «Меню пусто».",
    page,
    async () => {
      expect(
        await availabilityManagement.list.isEmptyVisible(),
        "Сообщение «Меню пусто» показано.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Сотрудник видит пояснение, что позиции появятся после добавления в меню.",
    page,
    async () => {
      expect(
        await availabilityManagement.list.isEmptyDescriptionVisible(),
        "Пояснение о появлении позиций после добавления в меню показано.",
      ).toBe(true);
    },
  );
});
