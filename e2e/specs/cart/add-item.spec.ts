import {
  CartItemSize,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer добавляет опубликованный товар с исходной конфигурацией в корзину.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с размером M и обязательной добавкой «Обычное молоко»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показана одна позиция «Капучино» размера M с обязательной добавкой, количеством и стоимостью.
 * - Количество товаров и итог корзины соответствуют добавленной позиции.
 */
test("CART-01: customer добавляет товар в корзину", async ({
  page,
  checkout,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  const configurationTotal = await publicMenu.product.readConfigurationTotal();
  await publicMenu.product.addToCart();
  await checkout.cart.open();

  await expectedResult(
    "В корзине показана одна позиция «Капучино» размера M с обязательной добавкой, количеством и стоимостью.",
    page,
    async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине показана одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "Название позиции соответствует добавленному товару.",
      ).toBe("Капучино");
      expect(
        await checkout.cart.readItemVariant(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "В позиции показан размер M.",
      ).toBe(CartItemSize.M);
      expect(
        await checkout.cart.readItemModifiers(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "В позиции показана обязательная добавка.",
      ).toEqual(["+ Обычное молоко"]);
      expect(
        await checkout.cart.readItemQuantity(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "В позиции показано количество один.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "В позиции показана стоимость исходной конфигурации.",
      ).toBe(configurationTotal);
    },
  );
  await expectedResult(
    "Количество товаров и итог корзины соответствуют добавленной позиции.",
    page,
    async () => {
      expect(
        await checkout.cart.readItemQuantity(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "Количество товаров равно одному.",
      ).toBe(1);
      expect(
        await checkout.cart.readTotal(),
        "Итог корзины соответствует стоимости позиции.",
      ).toBe(configurationTotal);
    },
  );
});
