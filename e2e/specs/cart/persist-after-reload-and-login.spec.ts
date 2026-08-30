import {
  CartItemSize,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer сохраняет корзину после перезагрузки страницы и успешного входа.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с размером M и «Обычное молоко»; тестовое окружение предоставляет OTP customer; customer не авторизован, корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer перезагружает публичный интерфейс.
 * 6. Customer открывает корзину.
 * 7. Customer начинает оформление заказа.
 * 8. Customer вводит номер телефона.
 * 9. Customer запрашивает одноразовый код.
 * 10. Customer вводит одноразовый код.
 * 11. Customer подтверждает одноразовый код.
 *
 * Ожидаемый результат:
 * - После перезагрузки корзина содержит «Капучино» размера M с прежними добавкой и количеством.
 * - После успешного входа customer возвращается к корзине с той же позицией.
 */
test("CART-06: customer сохраняет корзину после перезагрузки и входа", async ({
  page,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await customerAuth.reload();
  await checkout.cart.open();

  await expectedResult(
    "После перезагрузки корзина содержит «Капучино» размера M с прежними добавкой и количеством.",
    page,
    async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "После перезагрузки в корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После перезагрузки сохранено наименование позиции.",
      ).toBe("Капучино");
      expect(
        await checkout.cart.readItemVariant(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После перезагрузки сохранён размер M.",
      ).toBe(CartItemSize.M);
      expect(
        await checkout.cart.readItemModifiers(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После перезагрузки сохранена обязательная добавка.",
      ).toEqual(["+ Обычное молоко"]);
      expect(
        await checkout.cart.readItemQuantity(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После перезагрузки сохранено количество один.",
      ).toBe(1);
    },
  );
  await checkout.cart.startCheckout();
  await checkout.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await checkout.phoneVerification.requestCode();
  await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await checkout.phoneVerification.confirm();

  await expectedResult(
    "После успешного входа customer возвращается к корзине с той же позицией.",
    page,
    async () => {
      expect(
        await checkout.isCartOpen(),
        "После входа снова открыта корзина.",
      ).toBe(true);
      expect(
        await checkout.cart.readItemsCount(),
        "После входа в корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После входа сохранено наименование позиции.",
      ).toBe("Капучино");
      expect(
        await checkout.cart.readItemVariant(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После входа сохранён размер M.",
      ).toBe(CartItemSize.M);
      expect(
        await checkout.cart.readItemModifiers(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После входа сохранена обязательная добавка.",
      ).toEqual(["+ Обычное молоко"]);
      expect(
        await checkout.cart.readItemQuantity(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "После входа сохранено количество один.",
      ).toBe(1);
    },
  );
});
