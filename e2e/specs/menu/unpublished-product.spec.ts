import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: покупатель не видит неактивный товар в публичном меню.
 *
 * Предусловия: изолированный профиль `mutating` содержит категорию «Кофе» с опубликованным доступным «Капучино» и неактивным «Тестовым напитком».
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель открывает категорию «Кофе».
 *
 * Ожидаемый результат:
 * - Покупатель видит опубликованный доступный «Капучино».
 * - Покупатель не видит неактивный «Тестовый напиток».
 */
test("MENU-07: покупатель не видит неактивный товар", async ({
  page,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");

  await expectedResult(
    "Покупатель видит опубликованный доступный «Капучино».",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductVisible("Капучино"),
        "Опубликованный доступный «Капучино» показан в категории.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Покупатель не видит неактивный «Тестовый напиток».",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductAbsent("Тестовый напиток"),
        "Неактивный «Тестовый напиток» отсутствует в публичном меню.",
      ).toBe(true);
    },
  );
});
