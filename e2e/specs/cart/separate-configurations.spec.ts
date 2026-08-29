import { expect, ProductConfiguratorSize, test } from "@fixtures/test";

/**
 * Назначение: разные наборы добавок сохраняются отдельными позициями корзины.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с обязательной добавкой «Обычное молоко» и доступной «Овсяное молоко»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer снова открывает «Капучино».
 * 6. Customer выбирает добавку «Овсяное молоко».
 * 7. Customer добавляет изменённую конфигурацию в корзину.
 * 8. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показаны две отдельные позиции «Капучино».
 * - Каждая позиция показывает собственную добавку, количество и стоимость.
 * - Итог корзины равен 720 ₽.
 */
test("CART-03: customer видит раздельные конфигурации", async ({
  checkout,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectModifier("Овсяное молоко");
  await publicMenu.product.addToCart();
  await checkout.cart.open();

  await test.step("В корзине показаны две отдельные позиции «Капучино».", async () => {
    expect(
      await checkout.cart.readItemsCount(),
      "В корзине показаны две отдельные позиции.",
    ).toBe(2);
    expect(
      await checkout.cart.readItemNames(),
      "Обе позиции относятся к капучино.",
    ).toEqual(["Капучино", "Капучино"]);
  });
  await test.step("Каждая позиция показывает собственную добавку, количество и стоимость.", async () => {
    expect(
      await checkout.cart.readItemModifiers(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Первая позиция содержит обычное молоко.",
    ).toEqual(["+ Обычное молоко"]);
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Количество первой позиции равно одному.",
    ).toBe(1);
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Стоимость первой позиции равна 320 ₽.",
    ).toBe("320 ₽");
    expect(
      await checkout.cart.readItemModifiers(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Овсяное молоко"],
      ),
      "Вторая позиция содержит овсяное молоко.",
    ).toEqual(["+ Овсяное молоко"]);
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Овсяное молоко"],
      ),
      "Количество второй позиции равно одному.",
    ).toBe(1);
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Овсяное молоко"],
      ),
      "Стоимость второй позиции равна 400 ₽.",
    ).toBe("400 ₽");
  });
  await test.step("Итог корзины равен 720 ₽.", async () => {
    expect(
      await checkout.cart.readTotal(),
      "Итог корзины равен сумме стоимостей обеих позиций.",
    ).toBe("720 ₽");
  });
});
