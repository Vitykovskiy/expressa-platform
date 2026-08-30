import { expect, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: customer просматривает меню при временно закрытом приёме новых заказов.
 *
 * Предусловия: seed-сценарий `intake-closed` предоставляет закрытый приём заказов и опубликованные категории «Кофе» и «Выпечка» в изолированном запуске.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение «Новые заказы временно не принимаются».
 * - Customer видит доступные категории и количество товаров в каждой из них.
 */
test("MENU-03: customer видит меню при закрытом приёме заказов", async ({
  page,
  publicMenu,
  e2eEnvironment,
}) => {
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);

  await expectedResult(
    "Customer видит сообщение «Новые заказы временно не принимаются».",
    page,
    async () => {
      expect(
        await publicMenu.isIntakeClosed(),
        "Показано сообщение о временно закрытом приёме заказов.",
      ).toBe(true);
    },
  );
  await expectedResult(
    "Customer видит доступные категории и количество товаров в каждой из них.",
    page,
    async () => {
      const [categoryNames, productCounts] = await Promise.all([
        publicMenu.readCategoryNames(),
        publicMenu.readCategoryProductCounts(),
      ]);

      expect(categoryNames, "Категория «Кофе» показана в меню.").toContain(
        "Кофе",
      );
      expect(categoryNames, "Категория «Выпечка» показана в меню.").toContain(
        "Выпечка",
      );
      expect(
        productCounts[categoryNames.indexOf("Кофе")],
        "Для категории «Кофе» показано количество товаров.",
      ).toBeGreaterThan(0);
      expect(
        productCounts[categoryNames.indexOf("Выпечка")],
        "Для категории «Выпечка» показано количество товаров.",
      ).toBeGreaterThan(0);
    },
  );
});
