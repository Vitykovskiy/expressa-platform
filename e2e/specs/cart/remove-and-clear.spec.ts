import { expect, ProductConfiguratorSize, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer удаляет позицию, а удаление последней позиции очищает корзину.
 *
 * Предусловия: профиль seeded содержит опубликованный доступный «Капучино» в категории «Кофе» с размерами M и S и обязательной добавкой «Обычное молоко»; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет конфигурацию размера M в корзину.
 * 5. Customer снова открывает «Капучино».
 * 6. Customer выбирает размер S.
 * 7. Customer добавляет конфигурацию размера S в корзину.
 * 8. Customer открывает корзину.
 * 9. Customer удаляет позицию размера M.
 * 10. Customer удаляет позицию размера S.
 * 11. Customer переходит в меню.
 *
 * Ожидаемый результат:
 * - После первого удаления в корзине остаётся только позиция размера S со стоимостью 280 ₽.
 * - После удаления последней позиции показано пустое состояние корзины.
 * - Customer видит меню после перехода из пустой корзины.
 */
test("CART-05: customer удаляет позиции и очищает корзину", async ({
  page,
  checkout,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.selectVariant(ProductConfiguratorSize.S);
  await publicMenu.product.addToCart();
  await checkout.cart.open();
  await checkout.cart.remove("Капучино", ProductConfiguratorSize.M, [
    "Обычное молоко",
  ]);

  await expectedResult(
    "После первого удаления в корзине остаётся только позиция размера S со стоимостью 280 ₽.",
    page,
    async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине осталась одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemQuantity(
          "Капучино",
          ProductConfiguratorSize.S,
          ["Обычное молоко"],
        ),
        "Количество оставшейся позиции равно одному.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemLineTotal(
          "Капучино",
          ProductConfiguratorSize.S,
          ["Обычное молоко"],
        ),
        "Стоимость оставшейся позиции равна 280 ₽.",
      ).toBe("280 ₽");
    },
  );
  await checkout.cart.remove("Капучино", ProductConfiguratorSize.S, [
    "Обычное молоко",
  ]);
  await expectedResult(
    "После удаления последней позиции показано пустое состояние корзины.",
    page,
    async () => {
      expect(
        await checkout.cart.isEmptyStateVisible(),
        "Показано пустое состояние корзины.",
      ).toBe(true);
      expect(
        await checkout.cart.readItemsCount(),
        "Список позиций отсутствует.",
      ).toBe(0);
    },
  );
  await checkout.cart.continueToMenu();
  await expectedResult(
    "Customer видит меню после перехода из пустой корзины.",
    page,
    async () => {
      expect(
        await publicMenu.readCategoryNames(),
        "В меню показана категория «Кофе».",
      ).toContain("Кофе");
    },
  );
});
