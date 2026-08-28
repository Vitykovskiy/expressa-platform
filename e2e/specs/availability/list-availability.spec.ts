import {
  AvailabilityState,
  ModifierSelectionType,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник видит доступные для управления товары, размеры и добавки.
 *
 * Предусловия: administrator авторизован; в уникальной категории есть капучино размера M и добавка «Молоко · Овсяное».
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 *
 * Ожидаемый результат:
 * - Сотрудник видит созданную категорию.
 * - Сотрудник видит отдельные строки товара, размера и добавки.
 * - Каждая позиция показывает текущее состояние доступности.
 */
test("AVAIL-01: сотрудник видит список позиций", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `Кофе ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;
  const groupName = `Молоко ${testInfo.testId}`;
  const optionName = `Овсяное ${testInfo.testId}`;
  try {
    await test.step("Подготовка: administrator публикует категорию, капучино размера M и обязательную добавку.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория доступности",
      );
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(productName);
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(ProductEditorSize.M, "25000");
      await menuManagement.productEditor.save(productName);
      await menuManagement.modifierGroupEditor.openManagement();
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(groupName);
      await menuManagement.modifierGroupEditor.setRequired();
      await menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(optionName);
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.setOptionDefault();
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(categoryName);
      await menuManagement.assignments.selectGroup(groupName);
      await menuManagement.assignments.save();
    });
    await availabilityManagement.open();
    await test.step("Сотрудник видит созданную категорию.", async () => {
      await availabilityManagement.list.assertCategoryVisible(categoryName);
    });
    await test.step("Сотрудник видит отдельные строки товара, размера и добавки.", async () => {
      await availabilityManagement.list.assertItemVisible(productName);
      await availabilityManagement.list.assertItemVisible(`${productName} · M`);
      await availabilityManagement.list.assertItemVisible(
        `${groupName} · ${optionName}`,
      );
    });
    await test.step("Каждая позиция показывает текущее состояние доступности.", async () => {
      await availabilityManagement.list.assertItemAvailability(
        productName,
        AvailabilityState.AVAILABLE,
      );
      await availabilityManagement.list.assertItemAvailability(
        `${productName} · M`,
        AvailabilityState.AVAILABLE,
      );
      await availabilityManagement.list.assertItemAvailability(
        `${groupName} · ${optionName}`,
        AvailabilityState.AVAILABLE,
      );
    });
  } finally {
    await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
    await backOfficeAuth.form.signIn(e2eCredentials.administrator);
    await menuManagement.open();
    await menuManagement.catalog.expandCategoryIfPresent(categoryName);
    await menuManagement.productEditor.deleteIfPresent(productName);
    await menuManagement.modifierGroupEditor.archiveIfPresent(groupName);
    await menuManagement.categoryEditor.archiveIfPresent(categoryName);
    await backOfficeAuth.form.signOut();
  }
});
