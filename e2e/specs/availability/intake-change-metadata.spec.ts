import { AvailabilityState, expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит автора и время последнего изменения приёма новых заказов.
 *
 * Предусловия: тестовое окружение предоставляет staff с номером `E2E_STAFF_PHONE`; seed-сценарий `canonical` предоставляет открытый приём новых заказов в изолированном запуске.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает приём новых заказов.
 *
 * Ожидаемый результат:
 * - Рядом с приёмом новых заказов указан сотрудник, выполнивший действие.
 * - Рядом с приёмом новых заказов указаны фактические дата и время действия.
 */
test("AVAIL-06: сотрудник видит метаданные изменения приёма заказов", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await availabilityManagement.open();
  await availabilityManagement.list.setIntake(AvailabilityState.UNAVAILABLE);
  const metadata = await availabilityManagement.list.readIntakeChangeMetadata();
  await test.step("Рядом с приёмом новых заказов указан сотрудник, выполнивший действие.", async () => {
    expect(
      metadata.actor,
      "Показан номер staff, выполнившего изменение приёма заказов.",
    ).toBe(e2eCredentials.staff.phone);
  });
  await test.step("Рядом с приёмом новых заказов указаны фактические дата и время действия.", async () => {
    expect(
      metadata.displayedAt,
      "Показаны допустимые дата и время последнего изменения приёма заказов.",
    ).toMatch(
      /^(?:(?:0[1-9]|[12]\d|3[01])\.(?:0[1-9]|1[0-2])\.\d{4}, (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d)$/u,
    );
  });
});
