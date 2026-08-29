import { expect, ProductConfiguratorSize, test } from "@fixtures/test";

/**
 * Назначение: покупатель последовательно открывает категорию и товар из публичного меню.
 *
 * Предусловия: изолированный профиль `seeded` содержит категорию «Кофе» с опубликованным доступным «Капучино» и группой добавок «Молоко».
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель открывает категорию «Кофе».
 * 3. Покупатель открывает «Капучино».
 *
 * Ожидаемый результат:
 * - Покупатель видит название выбранной категории и её товары.
 * - Покупатель видит название, описание и цену выбранного товара.
 * - Покупатель видит доступные варианты товара и группы добавок.
 */
test("MENU-04: покупатель открывает категорию и товар", async ({
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");

  await test.step("Покупатель видит название выбранной категории и её товары.", async () => {
    expect(
      await publicMenu.readOpenedCategoryName(),
      "Открыта категория «Кофе».",
    ).toBe("Кофе");
    expect(
      await publicMenu.readOpenedProductNames(),
      "В категории показаны опубликованные товары.",
    ).toEqual(["Капучино", "Эспрессо"]);
  });
  await publicMenu.product.openProduct("Капучино");

  await test.step("Покупатель видит название, описание и цену выбранного товара.", async () => {
    expect(
      await publicMenu.product.readOpenedProductTitle(),
      "Открыта конфигурация «Капучино».",
    ).toBe("Капучино");
    expect(
      await publicMenu.product.isProductDescriptionVisible(
        "Эспрессо с молочной пеной.",
      ),
      "Описание «Капучино» показано.",
    ).toBe(true);
    expect(
      await publicMenu.product.readProductPrice(),
      "Показана цена выбранного размера.",
    ).toBe("320 ₽");
  });
  await test.step("Покупатель видит доступные варианты товара и группы добавок.", async () => {
    expect(
      await publicMenu.product.readVariants(),
      "Доступны размеры S, M и L.",
    ).toEqual([
      ProductConfiguratorSize.S,
      ProductConfiguratorSize.M,
      ProductConfiguratorSize.L,
    ]);
    expect(
      await publicMenu.product.readModifierGroupNames(),
      "Показана группа добавок «Молоко».",
    ).toEqual(["Молоко"]);
  });
});
