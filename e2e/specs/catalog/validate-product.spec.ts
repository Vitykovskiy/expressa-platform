import { ProductEditorSize, ProductType, expect, test } from "@fixtures/test";

/**
 * Назначение: подтвердить, что напиток не сохраняется без корректной цены каждого выбранного размера.
 *
 * Предусловия: администратор авторизован; в каталоге есть категория.
 *
 * Сценарий:
 * 1. Администратор нажимает «Добавить товар».
 * 2. Администратор выбирает категорию товара.
 * 3. Администратор выбирает тип «Напиток».
 * 4. Администратор указывает название товара.
 * 5. Администратор указывает цену размера M.
 * 6. Администратор указывает цену размера L.
 * 7. Администратор указывает отрицательную цену размера S.
 *
 * Ожидаемый результат:
 * - Администратор видит сообщение «Укажите цену для каждого выбранного размера».
 * - Действие сохранения товара недоступно.
 */
test("CATALOG-09: администратор видит валидацию цены напитка", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
}, testInfo) => {
  const categoryName = `E2E Валидация ${testInfo.testId}`;
  const productName = `E2E Напиток ${testInfo.testId}`;
  let primaryError: unknown;
  let hasPrimaryFailure = false;
  let cleanupError: unknown;
  let hasCleanupFailure = false;
  let isProductEditorOpen = false;

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();

  try {
    await menuManagement.categoryEditor.startCreation();
    await menuManagement.categoryEditor.fillName(categoryName);
    await menuManagement.categoryEditor.fillDescription("Категория валидации");
    await menuManagement.categoryEditor.save(categoryName);

    await menuManagement.productEditor.startCreation();
    isProductEditorOpen = true;
    await menuManagement.productEditor.selectCategory(categoryName);
    await menuManagement.productEditor.selectType(ProductType.DRINK);
    await menuManagement.productEditor.fillName(productName);
    await menuManagement.productEditor.setPrice(ProductEditorSize.M, "249");
    await menuManagement.productEditor.setPrice(ProductEditorSize.L, "299");
    await menuManagement.productEditor.setPrice(ProductEditorSize.S, "-1");

    await test.step("Администратор видит сообщение «Укажите цену для каждого выбранного размера».", async () => {
      expect(
        await menuManagement.productEditor.readSizesPriceValidation(),
        "Показано сообщение «Укажите цену для каждого выбранного размера».",
      ).toBe("Укажите цену для каждого выбранного размера");
    });
    await test.step("Действие сохранения товара недоступно.", async () => {
      expect(
        await menuManagement.productEditor.isCreateSaveAvailable(),
        "Действие сохранения товара недоступно.",
      ).toBe(false);
    });
  } catch (error) {
    primaryError = error;
    hasPrimaryFailure = true;
  } finally {
    try {
      if (isProductEditorOpen) {
        await menuManagement.productEditor.cancelCreation();
      }
      await menuManagement.productEditor.deleteIfPresent(productName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    } catch (error) {
      if (!hasPrimaryFailure) {
        cleanupError = error;
        hasCleanupFailure = true;
      } else {
        try {
          await testInfo.attach("Ошибка очистки", {
            body:
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error),
            contentType: "text/plain",
          });
        } catch {
          // Исходная ошибка сценария сохраняет приоритет.
        }
      }
    }
  }

  if (hasPrimaryFailure) throw primaryError;
  if (hasCleanupFailure) throw cleanupError;
});
