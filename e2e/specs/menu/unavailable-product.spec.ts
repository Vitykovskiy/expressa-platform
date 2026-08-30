import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: покупатель не может выбрать недоступный товар из публичного меню.
 *
 * Предусловия: изолированный профиль `mutating` содержит категорию «Выпечка» с доступным «Круассаном» и недоступным «Чизкейком».
 *
 * Сценарий:
 * 1. Покупатель открывает публичное меню.
 * 2. Покупатель открывает категорию «Выпечка».
 *
 * Ожидаемый результат:
 * - Покупатель видит недоступный «Чизкейк» в списке товаров категории.
 * - Покупатель не может открыть недоступный «Чизкейк».
 * - Покупатель видит доступный «Круассан» той же категории.
 */
test("MENU-06: покупатель не может открыть недоступный товар", async ({
  page,
  e2eEnvironment,
  publicMenu,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Выпечка");

  await expectedResult(
    "Покупатель видит недоступный «Чизкейк» в списке товаров категории.",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductVisible("Чизкейк"),
        "Недоступный «Чизкейк» показан в категории.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Покупатель не может открыть недоступный «Чизкейк».",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductOpenable("Чизкейк"),
        "Кнопка открытия недоступного «Чизкейка» выключена.",
      ).toBe(false);
    },
  );
  await expectedResult(
    "Покупатель видит доступный «Круассан» той же категории.",
    page,
    async () => {
      expect(
        await publicMenu.product.isProductVisible("Круассан"),
        "Доступный «Круассан» показан в категории.",
      ).toBe(true);
    },
  );
});
