import { AvailabilityState, expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит автора и дату-время собственного изменения приёма новых заказов.
 *
 * Предусловия: сотрудник может авторизоваться в back-office; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает приём новых заказов.
 *
 * Ожидаемый результат:
 * - Рядом с приёмом новых заказов показан идентификатор сотрудника, выполнившего действие.
 * - Рядом с приёмом новых заказов показаны дата и время выполненного действия.
 */
test("AVAIL-06: сотрудник видит метаданные изменения приёма заказов", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  try {
    const baselineMetadata =
      await test.step("Подготовка: administrator создаёт исходные метаданные открытого приёма заказов.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await availabilityManagement.open();
        await availabilityManagement.list.setIntake(
          AvailabilityState.UNAVAILABLE,
        );
        await availabilityManagement.list.setIntake(
          AvailabilityState.AVAILABLE,
        );
        const metadata =
          await availabilityManagement.list.readIntakeChangeMetadata();
        await backOfficeAuth.form.signOut();

        return metadata;
      });

    await test.step("Предусловие: сотрудник входит в back-office.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
    });
    await availabilityManagement.open();
    await availabilityManagement.list.setIntake(AvailabilityState.UNAVAILABLE);
    const metadata =
      await availabilityManagement.list.readChangedIntakeMetadata(
        baselineMetadata,
      );

    await test.step("Рядом с приёмом новых заказов показан идентификатор сотрудника, выполнившего действие.", async () => {
      expect(
        metadata.actor,
        "Показан UUID сотрудника, выполнившего изменение приёма заказов.",
      ).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(
        metadata.actor,
        "Автор изменения приёма заказов отличается от автора исходного состояния.",
      ).not.toBe(baselineMetadata.actor);
    });
    await test.step("Рядом с приёмом новых заказов показаны дата и время выполненного действия.", async () => {
      expect(
        metadata.displayedAt,
        "Показаны дата и время последнего изменения приёма заказов.",
      ).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2}$/);
    });
  } finally {
    await test.step("Очистка: сотрудник открывает приём новых заказов.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
      await availabilityManagement.open();
      const cleanupMetadata =
        await availabilityManagement.list.readIntakeChangeMetadata();
      const intakeChanged = await availabilityManagement.list.setIntake(
        AvailabilityState.AVAILABLE,
      );
      if (intakeChanged) {
        await availabilityManagement.list.readChangedIntakeMetadata(
          cleanupMetadata,
        );
      }
      await backOfficeAuth.form.signOut();
    });
  }
});
