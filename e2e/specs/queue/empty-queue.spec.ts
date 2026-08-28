import { expect, test } from "@fixtures/test";

/**
 * Назначение: сотрудник видит пустую очередь при отсутствии заказов для показа.
 *
 * Предусловия: barista авторизован в back-office; в профиле E2E `empty` заказы для текущего фильтра отсутствуют.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 *
 * Ожидаемый результат:
 * - В разделе показано пустое состояние «Заказов нет».
 * - Пустое состояние сообщает, что активные заказы появятся в очереди.
 */
test("QUEUE-01: сотрудник видит пустую очередь заказов", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  await test.step("Предусловие: barista входит в back-office.", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.staff);
  });
  await staffOrders.open();

  await test.step("В разделе показано пустое состояние «Заказов нет».", async () => {
    expect(
      await staffOrders.queue.isEmptyVisible(),
      "Пустое состояние «Заказов нет» показано.",
    ).toBe(true);
  });
  await test.step("Пустое состояние сообщает, что активные заказы появятся в очереди.", async () => {
    expect(
      await staffOrders.queue.isEmptyDescriptionVisible(),
      "Пояснение о появлении активных заказов показано.",
    ).toBe(true);
  });
});
