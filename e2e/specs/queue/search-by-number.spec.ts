import { OrderStatus, expectedResult, test } from "@fixtures/test";

/**
 * Назначение: сотрудник находит заказ по его номеру.
 *
 * Предусловия: изолированный профиль `queue-populated` содержит заказы №20300102-001 и №20300102-002; staff может войти через UI.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник вводит номер заказа №20300102-001 в поле поиска.
 * 3. Сотрудник очищает поле поиска.
 *
 * Ожидаемый результат:
 * - Поиск показывает карточку заказа №20300102-001.
 * - Карточка заказа №20300102-002 не показана во время поиска.
 * - После очистки поиска очередь снова показывает заказы №20300102-001—005.
 */
test("QUEUE-04: сотрудник ищет заказ по номеру", async ({
  page,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  staffOrders,
}) => {
  const target = {
    id: "00000000-0000-4000-8000-000000000001",
    number: "20300102-001",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.CREATED,
  };
  const other = {
    id: "00000000-0000-4000-8000-000000000002",
    number: "20300102-002",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.ACCEPTED,
  };
  const preparing = {
    id: "00000000-0000-4000-8000-000000000003",
    number: "20300102-003",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.PREPARING,
  };
  const ready = {
    id: "00000000-0000-4000-8000-000000000004",
    number: "20300102-004",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.READY,
  };
  const issued = {
    id: "00000000-0000-4000-8000-000000000005",
    number: "20300102-005",
    productName: "Капучино",
    size: "M",
    modifierName: "Обычное молоко",
    quantity: "1",
    lineTotal: "320 ₽",
    total: "320 ₽",
    status: OrderStatus.ISSUED,
  };

  await test.step("Подготовка: staff авторизуется", async () => {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.fillPhone(e2eCredentials.staff.phone);
    await backOfficeAuth.form.requestCode();
    await backOfficeAuth.form.fillCode(e2eCredentials.staff.otp);
    await backOfficeAuth.form.confirmCode();
  });

  await staffOrders.open();
  await staffOrders.queue.searchByNumber(target.number);
  await expectedResult(
    "Поиск показывает карточку заказа №20300102-001.",
    page,
    async () => {
      await staffOrders.queue.assertOrderVisible(target);
    },
  );
  await expectedResult(
    "Карточка заказа №20300102-002 не показана во время поиска.",
    page,
    async () => {
      await staffOrders.queue.assertOrderHidden(other);
      await staffOrders.queue.assertOrderHidden(preparing);
      await staffOrders.queue.assertOrderHidden(ready);
      await staffOrders.queue.assertOrderHidden(issued);
    },
  );
  await staffOrders.queue.clearSearch();
  await expectedResult(
    "После очистки поиска очередь снова показывает заказы №20300102-001—005.",
    page,
    async () => {
      await staffOrders.queue.assertOrderVisible(target);
      await staffOrders.queue.assertOrderVisible(other);
      await staffOrders.queue.assertOrderVisible(preparing);
      await staffOrders.queue.assertOrderVisible(ready);
      await staffOrders.queue.assertOrderVisible(issued);
    },
  );
});
