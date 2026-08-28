import {
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник выключает размер напитка, а customer видит его недоступность.
 *
 * Предусловия: administrator авторизован в back-office; customer может открыть публичное меню;
 * размер «Капучино · M» уникального напитка доступен.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает размер «Капучино · M».
 * 3. Customer открывает карточку товара «Капучино».
 *
 * Ожидаемый результат:
 * - В back-office размер «Капучино · M» отображается недоступным.
 * - Customer не может выбрать размер M для «Капучино».
 */
test("AVAIL-07: сотрудник выключает размер напитка", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Кофе ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;
  const sizeName = `${productName} · ${ProductConfiguratorSize.M}`;

  try {
    await test.step("Подготовка: administrator публикует уникальную категорию и капучино с размерами S, M и L.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория выключения размера напитка",
      );
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.setPrice(ProductEditorSize.S, "25000");
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.setPrice(ProductEditorSize.L, "25000");
      await menuManagement.productEditor.save(productName);
    });

    await availabilityManagement.open();
    await availabilityManagement.list.search(productName);
    await availabilityManagement.list.setSizeAvailability(
      sizeName,
      AvailabilityState.UNAVAILABLE,
    );
    await test.step("В back-office размер «Капучино · M» отображается недоступным.", async () => {
      await availabilityManagement.list.assertItemAvailability(
        sizeName,
        AvailabilityState.UNAVAILABLE,
      );
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await test.step("Предусловие интерфейса: customer открывает категорию товара.", async () => {
      await publicMenu.product.openCategory(categoryName);
    });
    await publicMenu.product.openProduct(productName);
    await test.step("Customer не может выбрать размер M для «Капучино».", async () => {
      expect(
        await publicMenu.product.isVariantSelectable(ProductConfiguratorSize.M),
        "Размер M недоступен для выбора.",
      ).toBe(false);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность размера и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(productName);
      await availabilityManagement.list.setSizeAvailability(
        sizeName,
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
