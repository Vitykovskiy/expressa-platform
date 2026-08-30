import { expectedResult, expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит пустую очередь при отсутствии заказов для показа.
 *
 * Предусловия: изолированный профиль `empty` предоставляет доступную роль barista и пустую очередь заказов.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 *
 * Ожидаемый результат:
 * - В разделе показано пустое состояние «Заказов нет».
 * - Пустое состояние сообщает, что активные заказы появятся в очереди.
 */
test("QUEUE-01: сотрудник видит пустую очередь заказов", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  await test.step("Подготовка: пользователь авторизуется.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });
  await staffOrders.open();

  await expectedResult(
    "В разделе показано пустое состояние «Заказов нет».",
    page,
    async () => {
      expect(
        await staffOrders.queue.isEmptyVisible(),
        "Пустое состояние «Заказов нет» показано.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Пустое состояние сообщает, что активные заказы появятся в очереди.",
    page,
    async () => {
      expect(
        await staffOrders.queue.isEmptyDescriptionVisible(),
        "Пояснение о появлении активных заказов показано.",
      ).toBe(true);
    },
  );
});
