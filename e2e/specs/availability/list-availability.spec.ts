import { AvailabilityState, expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит доступные для управления товары, размеры и добавки.
 *
 * Предусловия: тестовое окружение предоставляет роль administrator; seed-сценарий `canonical` предоставляет в изолированном запуске категории «Кофе» товар «Капучино», размер «Капучино · M» и добавку «Молоко · Овсяное молоко».
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 *
 * Ожидаемый результат:
 * - Сотрудник видит категорию «Кофе».
 * - Сотрудник видит отдельные строки товара, размера и добавки.
 * - Каждая позиция показывает текущее состояние доступности.
 */
test("AVAIL-01: сотрудник видит список позиций", async ({
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
  await test.step("Сотрудник видит категорию «Кофе».", async () => {
    expect(
      await availabilityManagement.list.isCategoryVisible("Кофе"),
      "Категория «Кофе» показана.",
    ).toBe(true);
  });
  await test.step("Сотрудник видит отдельные строки товара, размера и добавки.", async () => {
    expect(
      await availabilityManagement.list.isItemVisible("Капучино"),
      "Строка товара показана.",
    ).toBe(true);
    expect(
      await availabilityManagement.list.isItemVisible("Капучино · M"),
      "Строка размера показана.",
    ).toBe(true);
    expect(
      await availabilityManagement.list.isItemVisible(
        "Молоко · Овсяное молоко",
      ),
      "Строка добавки показана.",
    ).toBe(true);
  });
  await test.step("Каждая позиция показывает текущее состояние доступности.", async () => {
    expect(
      await availabilityManagement.list.readItemAvailability("Капучино"),
      "Товар доступен.",
    ).toBe(AvailabilityState.AVAILABLE);
    expect(
      await availabilityManagement.list.readItemAvailability("Капучино · M"),
      "Размер доступен.",
    ).toBe(AvailabilityState.AVAILABLE);
    expect(
      await availabilityManagement.list.readItemAvailability(
        "Молоко · Овсяное молоко",
      ),
      "Добавка доступна.",
    ).toBe(AvailabilityState.AVAILABLE);
  });
});
