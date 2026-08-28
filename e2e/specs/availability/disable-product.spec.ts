import { AvailabilityState, expect, ProductType, test } from "@fixtures/test";

/**
 * Назначение: сотрудник выключает товар, а customer видит его недоступность в публичном меню.
 *
 * Предусловия: administrator авторизован в back-office; customer может открыть публичное меню;
 * уникальный товар «Капучино» доступен.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает товар «Капучино».
 * 3. Customer открывает публичное меню.
 *
 * Ожидаемый результат:
 * - В back-office товар «Капучино» отображается недоступным.
 * - Customer не может выбрать недоступный товар «Капучино» в публичном меню.
 */
test("AVAIL-03: сотрудник выключает товар", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Кофе ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует уникальную категорию и доступный капучино.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория выключения товара",
      );
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.setSinglePrice("25000");
      await menuManagement.productEditor.save(productName);
    });

    await availabilityManagement.open();
    await availabilityManagement.list.search(productName);
    await availabilityManagement.list.setProductAvailability(
      productName,
      AvailabilityState.UNAVAILABLE,
    );
    await test.step("В back-office товар «Капучино» отображается недоступным.", async () => {
      await availabilityManagement.list.assertItemAvailability(
        productName,
        AvailabilityState.UNAVAILABLE,
      );
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await test.step("Предусловие интерфейса: customer открывает категорию товара.", async () => {
      await publicMenu.product.openCategory(categoryName);
    });
    await test.step("Customer не может выбрать недоступный товар «Капучино» в публичном меню.", async () => {
      expect(
        await publicMenu.product.isProductOpenable(productName),
        "Недоступный капучино нельзя выбрать в публичном меню.",
      ).toBe(false);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(productName);
      await availabilityManagement.list.setProductAvailability(
        productName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
