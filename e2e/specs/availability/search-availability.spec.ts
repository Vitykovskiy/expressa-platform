import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: сотрудник находит позицию по названию.
 *
 * Предусловия: тестовое окружение предоставляет роль administrator; seed-сценарий `canonical` предоставляет в изолированном запуске категории «Кофе» добавку «Молоко · Овсяное молоко» и товар «Капучино».
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник указывает в поиске «Овсяное».
 *
 * Ожидаемый результат:
 * - Список содержит добавку «Молоко · Овсяное молоко».
 * - Список не содержит товар «Капучино».
 */
test("AVAIL-02: сотрудник ищет позицию", async ({
  page,
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Подготовка: administrator авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.administrator.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.administrator.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.search("Овсяное");
  await expectedResult(
    "Список содержит добавку «Молоко · Овсяное молоко».",
    page,
    async () => {
      expect(
        await availabilityManagement.list.isItemVisible(
          "Молоко · Овсяное молоко",
        ),
        "Найденная добавка показана в списке.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Список не содержит товар «Капучино».",
    page,
    async () => {
      expect(
        await availabilityManagement.list.isItemVisible("Капучино"),
        "Товар, не совпадающий с поиском, не показан.",
      ).toBe(false);
    },
  );
});
