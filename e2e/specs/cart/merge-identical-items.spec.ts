import { expect, ProductConfiguratorSize, test } from "@fixtures/test";

/**
 * Назначение: повторное добавление одинаковой конфигурации увеличивает её количество, а не создаёт вторую позицию.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с исходной конфигурацией M и «Обычное молоко»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer снова открывает «Капучино».
 * 6. Customer снова добавляет исходную конфигурацию в корзину.
 * 7. Customer открывает корзину.
 *
 * Ожидаемый результат:
 * - В корзине показана одна позиция «Капучино».
 * - Количество позиции равно двум.
 * - Стоимость позиции и итог корзины равны 640 ₽.
 */
test("CART-02: customer объединяет одинаковые конфигурации", async ({
  checkout,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await checkout.cart.open();

  await test.step("В корзине показана одна позиция «Капучино».", async () => {
    expect(
      await checkout.cart.readItemsCount(),
      "В корзине показана одна позиция товара.",
    ).toBe(1);
  });
  await test.step("Количество позиции равно двум.", async () => {
    expect(
      await checkout.cart.readItemQuantity(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Количество позиции равно двум.",
    ).toBe(2);
  });
  await test.step("Стоимость позиции и итог корзины равны 640 ₽.", async () => {
    expect(
      await checkout.cart.readItemLineTotal(
        "Капучино",
        ProductConfiguratorSize.M,
        ["Обычное молоко"],
      ),
      "Стоимость позиции равна 640 ₽.",
    ).toBe("640 ₽");
    expect(await checkout.cart.readTotal(), "Итог корзины равен 640 ₽.").toBe(
      "640 ₽",
    );
  });
});
