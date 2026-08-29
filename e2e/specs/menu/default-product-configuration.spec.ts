import { expect, ProductConfiguratorSize, test } from "@fixtures/test";

/**
 * Назначение: покупатель видит начальную конфигурацию доступного напитка с обязательной группой добавок.
 *
 * Предусловия: изолированный профиль `seeded` содержит опубликованный доступный «Капучино» с размером M и обязательной группой «Молоко» с бесплатным вариантом «Обычное молоко» по умолчанию.
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель открывает категорию «Кофе».
 * 3. Покупатель открывает «Капучино».
 *
 * Ожидаемый результат:
 * - Покупатель видит выбранный размер M.
 * - Покупатель видит выбранную бесплатную добавку обязательной группы.
 * - Покупатель видит начальное количество «1».
 * - Покупатель видит итоговую цену выбранной конфигурации.
 */
test("MENU-05: покупатель видит конфигурацию напитка по умолчанию", async ({
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");

  await test.step("Покупатель видит выбранный размер M.", async () => {
    expect(
      await publicMenu.product.readSelectedSize(),
      "По умолчанию выбран размер M.",
    ).toBe(ProductConfiguratorSize.M);
  });
  await test.step("Покупатель видит выбранную бесплатную добавку обязательной группы.", async () => {
    expect(
      await publicMenu.product.readSelectedRequiredModifier("Молоко"),
      "По умолчанию выбрано «Обычное молоко».",
    ).toBe("Обычное молоко");
  });
  await test.step("Покупатель видит начальное количество «1».", async () => {
    expect(
      await publicMenu.product.readQuantity(),
      "Начальное количество равно одному.",
    ).toBe(1);
  });
  await test.step("Покупатель видит итоговую цену выбранной конфигурации.", async () => {
    expect(
      await publicMenu.product.readConfigurationTotal(),
      "Итог выбранной конфигурации равен 320 ₽.",
    ).toBe("320 ₽");
  });
});
