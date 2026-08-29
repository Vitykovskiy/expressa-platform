import { expect, ProductConfiguratorSize, test } from "@fixtures/test";

/**
 * Назначение: customer изменяет количество позиции, а корзина пересчитывает её стоимость и общий итог.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с исходной конфигурацией M и «Обычное молоко»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer открывает корзину.
 * 6. Customer устанавливает количество два.
 * 7. Customer устанавливает количество один.
 * 8. Customer устанавливает количество двадцать.
 *
 * Ожидаемый результат:
 * - После каждого изменения показаны новое количество, стоимость позиции и итог корзины.
 * - Стоимость позиции равна цене одной конфигурации, умноженной на количество.
 * - Customer может установить разрешённое по умолчанию количество двадцать.
 */
test("CART-04: customer изменяет количество и итог", async ({
  checkout,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.setQuantity("Капучино", 2, ProductConfiguratorSize.M, [
    "Обычное молоко",
  ]);

  await test.step("После каждого изменения показаны новое количество, стоимость позиции и итог корзины.", async () => {
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "После увеличения показано количество два.",
    ).toBe(2);
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "После увеличения показана стоимость 640 ₽.",
    ).toBe("640 ₽");
    expect(
      await checkout.cart.readTotal(),
      "После увеличения показан итог 640 ₽.",
    ).toBe("640 ₽");
  });
  await checkout.cart.setQuantity("Капучино", 1, ProductConfiguratorSize.M, [
    "Обычное молоко",
  ]);
  await test.step("Стоимость позиции равна цене одной конфигурации, умноженной на количество.", async () => {
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "После уменьшения показано количество один.",
    ).toBe(1);
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Стоимость одной конфигурации равна 320 ₽.",
    ).toBe("320 ₽");
    expect(await checkout.cart.readTotal(), "Итог корзины равен 320 ₽.").toBe(
      "320 ₽",
    );
  });
  await checkout.cart.setQuantity("Капучино", 20, ProductConfiguratorSize.M, [
    "Обычное молоко",
  ]);
  await test.step("Customer может установить разрешённое по умолчанию количество двадцать.", async () => {
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Customer установил количество двадцать.",
    ).toBe(20);
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Стоимость позиции пересчитана до 6 400 ₽.",
    ).toBe("6 400 ₽");
    expect(await checkout.cart.readTotal(), "Итог корзины равен 6 400 ₽.").toBe(
      "6 400 ₽",
    );
  });
});
