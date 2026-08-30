import { expect, OrderStatus, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer видит сохранённый снимок созданного заказа.
 *
 * Предусловия: изолированный профиль `order-snapshot` предоставляет customer
 * заказ №20300102-001 на стадии «Оформлен»; исходная категория «Кофе»
 * архивирована, а «Капучино» выключен.
 *
 * Сценарий:
 * 1. Customer открывает созданный заказ.
 *
 * Ожидаемый результат:
 * - Customer видит номер и стадию «Оформлен» сохранённого заказа.
 * - Customer видит сохранённые наименование «Капучино», размер M, добавку
 *   «Обычное молоко» и количество 1.
 * - Customer видит сохранённые сумму позиции и итог 320 ₽, а также оплату
 *   на кассе при получении.
 */
test("ORDER-01: customer видит снимок созданного заказа", async ({
  page,
  customerAuth,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await test.step("Подготовка: customer авторизуется", async () => {
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
  });

  await customerOrder.open(
    e2eEnvironment.frontOfficeUrl,
    "00000000-0000-4000-8000-000000000001",
  );

  await expectedResult(
    "Customer видит номер и стадию «Оформлен» сохранённого заказа.",
    page,
    async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.number, "Показан номер сохранённого заказа.").toBe(
        "20300102-001",
      );
      expect(order.status, "Показана стадия «Оформлен».").toBe(
        OrderStatus.CREATED,
      );
    },
  );
  await expectedResult(
    "Customer видит сохранённые наименование «Капучино», размер M, добавку «Обычное молоко» и количество 1.",
    page,
    async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.productName, "Показано сохранённое наименование.").toBe(
        "Капучино",
      );
      expect(order.size, "Показан сохранённый размер.").toBe("Размер M");
      expect(order.modifierName, "Показана сохранённая добавка.").toBe(
        "+ Обычное молоко",
      );
      expect(order.quantity, "Показано сохранённое количество.").toBe(
        "1 × 320 ₽",
      );
    },
  );
  await expectedResult(
    "Customer видит сохранённые сумму позиции и итог 320 ₽, а также оплату на кассе при получении.",
    page,
    async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.lineTotal, "Показана сохранённая сумма позиции.").toBe(
        "320 ₽",
      );
      expect(order.total, "Показан сохранённый итог заказа.").toBe("320 ₽");
      expect(
        await customerOrder.details.readPaymentMethod(),
        "Показана оплата на кассе при получении.",
      ).toBe("Оплата на кассе при получении");
    },
  );
});
