import {
  ModifierSelectionType,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник находит позицию по названию.
 *
 * Предусловия: administrator авторизован; в уникальной категории есть добавка «Молоко · Овсяное» и капучино.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник указывает в поиске «Овсяное».
 *
 * Ожидаемый результат:
 * - Список содержит добавку «Молоко · Овсяное».
 * - Список не содержит товар «Капучино».
 */
test("AVAIL-02: сотрудник ищет позицию", async ({
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
    await availabilityManagement.list.search("Овсяное");
    await test.step("Список содержит добавку «Молоко · Овсяное».", async () => {
      await availabilityManagement.list.assertItemVisible(
        `${groupName} · ${optionName}`,
      );
    });
    await test.step("Список не содержит товар «Капучино».", async () => {
      await availabilityManagement.list.assertItemHidden(productName);
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
