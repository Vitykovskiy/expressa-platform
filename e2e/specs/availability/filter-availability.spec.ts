import { ProductType, test } from "@fixtures/test";

/**
 * Назначение: сотрудник показывает позиции только выбранной категории.
 *
 * Предусловия: administrator авторизован; в уникальных категориях «Кофе» и «Чай» есть капучино и эрл грей.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел доступности.
 * 2. Сотрудник выбирает категорию «Кофе».
 *
 * Ожидаемый результат:
 * - Список содержит товар «Капучино».
 * - Список не содержит товар «Эрл Грей».
 */
test("AVAIL-13: сотрудник фильтрует позиции по категории", async ({
  availabilityManagement,
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const coffeeCategoryName = `Кофе ${testInfo.testId}`;
  const teaCategoryName = `Чай ${testInfo.testId}`;
  const cappuccinoName = `Капучино ${testInfo.testId}`;
  const earlGreyName = `Эрл Грей ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует уникальные категории «Кофе» и «Чай» с капучино и эрл греем.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(coffeeCategoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория доступности кофе",
      );
      await menuManagement.categoryEditor.save(coffeeCategoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(coffeeCategoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(cappuccinoName);
      await menuManagement.productEditor.setSinglePrice("25000");
      await menuManagement.productEditor.save(cappuccinoName);
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(teaCategoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория доступности чая",
      );
      await menuManagement.categoryEditor.save(teaCategoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(teaCategoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(earlGreyName);
      await menuManagement.productEditor.setSinglePrice("25000");
      await menuManagement.productEditor.save(earlGreyName);
    });

    await availabilityManagement.open();
    await availabilityManagement.list.selectCategory(coffeeCategoryName);

    await test.step("Список содержит товар «Капучино».", async () => {
      await availabilityManagement.list.assertItemVisible(cappuccinoName);
    });
    await test.step("Список не содержит товар «Эрл Грей».", async () => {
      await availabilityManagement.list.assertItemHidden(earlGreyName);
    });
  } finally {
    await test.step("Очистка: administrator удаляет позиции и архивирует категории сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(coffeeCategoryName);
      await menuManagement.productEditor.deleteIfPresent(cappuccinoName);
      await menuManagement.catalog.expandCategoryIfPresent(teaCategoryName);
      await menuManagement.productEditor.deleteIfPresent(earlGreyName);
      await menuManagement.categoryEditor.archiveIfPresent(coffeeCategoryName);
      await menuManagement.categoryEditor.archiveIfPresent(teaCategoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
