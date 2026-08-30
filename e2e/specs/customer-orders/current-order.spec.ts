import { expect, OrderStatus, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer просматривает собственный текущий заказ.
 *
 * Предусловия: изолированный профиль `order-created` содержит заказ customer №20300102-001 на стадии «Оформлен»; customer может войти через UI.
 *
 * Сценарий:
 * 1. Customer открывает собственный текущий заказ.
 *
 * Ожидаемый результат:
 * - Customer видит номер, стадию, состав и итоговую сумму заказа.
 * - Customer видит текст об оплате на кассе при получении.
 */
test("ORDER-03: customer видит текущий заказ", async ({
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
    "Customer видит номер, стадию, состав и итоговую сумму заказа.",
    page,
    async () => {
      const order = await customerOrder.details.readSnapshot();

      expect(order.number, "Показан номер заказа.").toBe("20300102-001");
      expect(order.status, "Показана стадия «Оформлен».").toBe(
        OrderStatus.CREATED,
      );
      expect(order.productName, "Показано наименование товара.").toBe(
        "Капучино",
      );
      expect(order.size, "Показан размер товара.").toBe("Размер M");
      expect(order.modifierName, "Показана добавка.").toBe("+ Обычное молоко");
      expect(order.quantity, "Показано количество товара.").toBe("1 × 320 ₽");
      expect(order.lineTotal, "Показана сумма позиции.").toBe("320 ₽");
      expect(order.total, "Показана итоговая сумма заказа.").toBe("320 ₽");
    },
  );
  await expectedResult(
    "Customer видит текст об оплате на кассе при получении.",
    page,
    async () => {
      expect(
        await customerOrder.details.readPaymentMethod(),
        "Показан способ оплаты при получении.",
      ).toBe("Оплата на кассе при получении");
    },
  );
});
