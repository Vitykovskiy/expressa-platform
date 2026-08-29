import {
  expect,
  OrderQueueStage,
  OrderStatus,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";

import type { OrderSnapshot } from "@support/data/order-snapshot.types";

/**
 * Назначение: full journey, в котором сотрудник видит новый заказ в уже открытой очереди.
 * Связанные capabilities: открытие очереди, добавление позиции в корзину, оформление заказа и live-актуализация очереди.
 *
 * Предусловия: изолированный запуск `mutating` с seed scenario `queue-populated` содержит активные заказы №20300102-001—004; тестовое окружение предоставляет staff и существующего customer с OTP.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Customer открывает публичное меню.
 * 3. Customer открывает категорию «Кофе».
 * 4. Customer открывает «Капучино».
 * 5. Customer выбирает размер M.
 * 6. Customer добавляет напиток в корзину.
 * 7. Customer открывает корзину.
 * 8. Customer оформляет заказ.
 * 9. Customer читает созданный заказ.
 *
 * Ожидаемый результат:
 * - Новый оформленный заказ появляется в открытой очереди.
 * - Подготовленные активные заказы остаются в очереди.
 */
test("QUEUE-06: очередь автоматически показывает новый заказ", async ({
  e2eCredentials,
  e2eEnvironment,
  multiSession,
}) => {
  const preparedOrders = [
    {
      order: {
        id: "00000000-0000-4000-8000-000000000001",
        lineTotal: "320 ₽",
        modifierName: "Обычное молоко",
        number: "20300102-001",
        productName: "Капучино",
        quantity: "1",
        size: "M",
        status: OrderStatus.CREATED,
        total: "320 ₽",
      } satisfies OrderSnapshot,
      stage: OrderQueueStage.CREATED,
    },
    {
      order: {
        id: "00000000-0000-4000-8000-000000000002",
        lineTotal: "320 ₽",
        modifierName: "Обычное молоко",
        number: "20300102-002",
        productName: "Капучино",
        quantity: "1",
        size: "M",
        status: OrderStatus.ACCEPTED,
        total: "320 ₽",
      } satisfies OrderSnapshot,
      stage: OrderQueueStage.ACCEPTED,
    },
    {
      order: {
        id: "00000000-0000-4000-8000-000000000003",
        lineTotal: "320 ₽",
        modifierName: "Обычное молоко",
        number: "20300102-003",
        productName: "Капучино",
        quantity: "1",
        size: "M",
        status: OrderStatus.PREPARING,
        total: "320 ₽",
      } satisfies OrderSnapshot,
      stage: OrderQueueStage.PREPARING,
    },
    {
      order: {
        id: "00000000-0000-4000-8000-000000000004",
        lineTotal: "320 ₽",
        modifierName: "Обычное молоко",
        number: "20300102-004",
        productName: "Капучино",
        quantity: "1",
        size: "M",
        status: OrderStatus.READY,
        total: "320 ₽",
      } satisfies OrderSnapshot,
      stage: OrderQueueStage.READY,
    },
  ];

  await test.step("Подготовка: staff авторизуется.", async () => {
    await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
    await multiSession.staff.auth.form.fillPhone(e2eCredentials.staff.phone);
    await multiSession.staff.auth.form.requestCode();
    await multiSession.staff.auth.form.fillCode(e2eCredentials.staff.otp);
    await multiSession.staff.auth.form.confirmCode();
  });
  await test.step("Подготовка: customer авторизуется.", async () => {
    await multiSession.secondCustomer.auth.open(e2eEnvironment.frontOfficeUrl);
    await multiSession.secondCustomer.auth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await multiSession.secondCustomer.auth.phoneVerification.requestCode();
    await multiSession.secondCustomer.auth.phoneVerification.fillCode(
      e2eCredentials.customer.otp,
    );
    await multiSession.secondCustomer.auth.phoneVerification.confirm();
  });

  await multiSession.staff.orders.open();
  await multiSession.secondCustomer.menu.open(e2eEnvironment.frontOfficeUrl);
  await multiSession.secondCustomer.menu.product.openCategory("Кофе");
  await multiSession.secondCustomer.menu.product.openProduct("Капучино");
  await multiSession.secondCustomer.menu.product.selectVariant(
    ProductConfiguratorSize.M,
  );
  await multiSession.secondCustomer.menu.product.addToCart();
  await multiSession.secondCustomer.checkout.cart.open();
  await multiSession.secondCustomer.checkout.cart.placeOrder();
  const createdOrder =
    await multiSession.secondCustomer.order.details.readSnapshot();

  await test.step("Новый оформленный заказ появляется в открытой очереди.", async () => {
    expect(
      await multiSession.staff.orders.queue.readCurrentStage(createdOrder),
      "Новый заказ показан в открытой очереди на стадии «Оформлен».",
    ).toBe(OrderQueueStage.CREATED);
  });
  await test.step("Подготовленные активные заказы остаются в очереди.", async () => {
    for (const { order, stage } of preparedOrders) {
      expect(
        await multiSession.staff.orders.queue.readCurrentStage(order),
        `Подготовленный заказ ${order.number} остаётся в очереди.`,
      ).toBe(stage);
    }
  });
});
