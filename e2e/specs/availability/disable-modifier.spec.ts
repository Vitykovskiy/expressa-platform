import {
  AvailabilityState,
  expect,
  ModifierSelectionType,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";

/**
 * Назначение: сотрудник выключает добавку, а customer видит её недоступность.
 *
 * Предусловия: administrator авторизован в back-office; customer может открыть публичное меню;
 * добавка «Молоко · Овсяное» уникального капучино доступна.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выключает добавку «Молоко · Овсяное».
 * 3. Customer открывает карточку товара «Капучино».
 *
 * Ожидаемый результат:
 * - В back-office добавка «Молоко · Овсяное» отображается недоступной.
 * - Customer не может выбрать добавку «Овсяное» для «Капучино».
 */
test("AVAIL-09: сотрудник выключает добавку", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Кофе ${testInfo.testId}`;
  const productName = `Капучино ${testInfo.testId}`;
  const groupName = `Молоко ${testInfo.testId}`;
  const optionName = `Овсяное ${testInfo.testId}`;
  const modifierName = `${groupName} · ${optionName}`;

  try {
    await test.step("Подготовка: administrator публикует уникальные категорию, капучино и обязательную добавку.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория выключения добавки",
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
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(categoryName);
      await menuManagement.assignments.selectGroup(groupName);
      await menuManagement.assignments.save();
    });

    await availabilityManagement.open();
    await availabilityManagement.list.search(productName);
    await availabilityManagement.list.setModifierAvailability(
      modifierName,
      AvailabilityState.UNAVAILABLE,
    );
    await test.step("В back-office добавка «Молоко · Овсяное» отображается недоступной.", async () => {
      await availabilityManagement.list.assertItemAvailability(
        modifierName,
        AvailabilityState.UNAVAILABLE,
      );
    });
    await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    await test.step("Предусловие интерфейса: customer открывает категорию товара.", async () => {
      await publicMenu.product.openCategory(categoryName);
    });
    await publicMenu.product.openProduct(productName);
    await test.step("Customer не может выбрать добавку «Овсяное» для «Капучино».", async () => {
      expect(
        await publicMenu.product.isModifierSelectable(optionName),
        "Добавка «Овсяное» недоступна для выбора.",
      ).toBe(false);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность добавки и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(productName);
      await availabilityManagement.list.setModifierAvailability(
        modifierName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(groupName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
