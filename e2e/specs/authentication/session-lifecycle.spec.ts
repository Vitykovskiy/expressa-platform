import {
  CustomerSessionState,
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  createProductOrderScenarioData,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer сохраняет вход после перезагрузки и может явно завершить сессию.
 *
 * Предусловия: customer уже авторизован в публичном интерфейсе;
 * в корзине customer есть товар.
 *
 * Сценарий:
 * 1. Customer перезагружает страницу публичного интерфейса.
 * 2. Customer выбирает «Выйти» рядом со своим номером телефона.
 *
 * Ожидаемый результат:
 * - После перезагрузки customer остаётся авторизованным.
 * - После выхода customer возвращается на главную страницу как гость.
 * - Корзина customer очищается.
 */
test("AUTH-07 — Customer восстанавливает и завершает сессию", async ({
  checkout,
  backOfficeAuth,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);
  let primaryError: unknown;
  let hasPrimaryFailure = false;

  try {
    await test.step("Подготовка данных сценария через UI", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(data.categoryName);
      await menuManagement.categoryEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.categoryEditor.save(data.categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(data.categoryName);
      await menuManagement.productEditor.selectType(ProductType.DRINK);
      await menuManagement.productEditor.fillName(data.productName);
      await menuManagement.productEditor.fillDescription(
        data.productDescription,
      );
      await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
      await menuManagement.productEditor.setPrice(
        ProductEditorSize.M,
        data.productPrice,
      );
      await menuManagement.productEditor.save(data.productName);
      await menuManagement.modifierGroupEditor.openManagement();
      await menuManagement.modifierGroupEditor.startCreation();
      await menuManagement.modifierGroupEditor.fillName(data.modifierGroupName);
      await menuManagement.modifierGroupEditor.setRequired();
      await menuManagement.modifierGroupEditor.selectType(
        ModifierSelectionType.SINGLE,
      );
      await menuManagement.modifierGroupEditor.addOption();
      await menuManagement.modifierGroupEditor.fillOptionName(
        data.modifierName,
      );
      await menuManagement.modifierGroupEditor.setOptionPrice("0");
      await menuManagement.modifierGroupEditor.setOptionDefault();
      await menuManagement.modifierGroupEditor.save();
      await menuManagement.assignments.openCategory(data.categoryName);
      await menuManagement.assignments.selectGroup(data.modifierGroupName);
      await menuManagement.assignments.save();
      await backOfficeAuth.form.signOut();

      await customerAuth.open(e2eEnvironment.frontOfficeUrl);
      await customerAuth.phoneVerification.fillPhone(
        e2eCredentials.customer.phone,
      );
      await customerAuth.phoneVerification.requestCode();
      await customerAuth.phoneVerification.fillCode(
        e2eCredentials.customer.otp,
      );
      await customerAuth.phoneVerification.confirm();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
      await publicMenu.product.openCategory(data.categoryName);
      await publicMenu.product.openProduct(data);
      await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
      await publicMenu.product.selectModifier(data.modifierName);
      await publicMenu.product.addToCart();
    });

    await customerAuth.reload();

    await test.step("После перезагрузки customer остаётся авторизованным", async () => {
      await customerAuth.assertSession(CustomerSessionState.AUTHENTICATED);
    });

    await customerAuth.signOut();

    await test.step("После выхода customer возвращается на главную страницу как гость", async () => {
      await customerAuth.assertSession(CustomerSessionState.GUEST);
    });

    await checkout.cart.open();

    await test.step("Корзина customer очищается", async () => {
      await checkout.cart.assertEmpty();
    });
  } catch (error) {
    primaryError = error;
    hasPrimaryFailure = true;
  }

  try {
    await test.step("Очистка данных сценария через UI", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(data.categoryName);
      await menuManagement.productEditor.deleteIfPresent(data.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        data.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(data.categoryName);
      await menuManagement.catalog.assertScenarioAbsent(data);
    });
  } catch (cleanupError) {
    if (!hasPrimaryFailure) throw cleanupError;

    try {
      await testInfo.attach("Ошибка очистки", {
        body:
          cleanupError instanceof Error
            ? (cleanupError.stack ?? cleanupError.message)
            : String(cleanupError),
        contentType: "text/plain",
      });
    } catch {
      // Исходная ошибка сценария сохраняет приоритет.
    }
  }

  if (hasPrimaryFailure) throw primaryError;
});
