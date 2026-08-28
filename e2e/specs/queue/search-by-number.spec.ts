import {
  ModifierSelectionType,
  ProductConfiguratorSize,
  ProductEditorSize,
  ProductType,
  test,
} from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: сотрудник находит заказ по его номеру.
 *
 * Предусловия: barista или administrator вошёл в back-office; в очереди есть заказ с известным номером и другой заказ с отличающимся номером.
 *
 * Сценарий:
 * 1. Сотрудник открывает раздел заказов.
 * 2. Сотрудник вводит номер подготовленного заказа в поле поиска.
 * 3. Сотрудник очищает поле поиска.
 *
 * Ожидаемый результат:
 * - Поиск показывает карточку заказа с введённым номером.
 * - Карточки с другими номерами не показаны во время поиска.
 * - После очистки поиска очередь снова показывает все подготовленные заказы.
 */
test("QUEUE-04: сотрудник ищет заказ по номеру", async ({
  backOfficeAuth,
  checkout,
  customerOrder,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
  staffOrders,
}, testInfo) => {
  const targetData = createProductOrderScenarioData(
    `${testInfo.testId}-target`,
  );
  const otherData = createProductOrderScenarioData(`${testInfo.testId}-other`);
  try {
    const targetOrder =
      await test.step("Подготовка: administrator публикует искомый товар, customer оформляет искомый заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(targetData.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          targetData.productDescription,
        );
        await menuManagement.categoryEditor.save(targetData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          targetData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(targetData.productName);
        await menuManagement.productEditor.fillDescription(
          targetData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          targetData.productPrice,
        );
        await menuManagement.productEditor.save(targetData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          targetData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          targetData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(targetData.categoryName);
        await menuManagement.assignments.selectGroup(
          targetData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(targetData.categoryName);
        await publicMenu.product.openProduct(targetData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(targetData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          targetData.productName,
          targetData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(targetData.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    const otherOrder =
      await test.step("Подготовка: administrator публикует второй товар, customer оформляет второй заказ.", async () => {
        await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
        await backOfficeAuth.form.signIn(e2eCredentials.administrator);
        await menuManagement.open();
        await menuManagement.categoryEditor.startCreation();
        await menuManagement.categoryEditor.fillName(otherData.categoryName);
        await menuManagement.categoryEditor.fillDescription(
          otherData.productDescription,
        );
        await menuManagement.categoryEditor.save(otherData.categoryName);
        await menuManagement.productEditor.startCreation();
        await menuManagement.productEditor.selectCategory(
          otherData.categoryName,
        );
        await menuManagement.productEditor.selectType(ProductType.DRINK);
        await menuManagement.productEditor.fillName(otherData.productName);
        await menuManagement.productEditor.fillDescription(
          otherData.productDescription,
        );
        await menuManagement.productEditor.useOnlySize(ProductEditorSize.M);
        await menuManagement.productEditor.setPrice(
          ProductEditorSize.M,
          otherData.productPrice,
        );
        await menuManagement.productEditor.save(otherData.productName);
        await menuManagement.modifierGroupEditor.openManagement();
        await menuManagement.modifierGroupEditor.startCreation();
        await menuManagement.modifierGroupEditor.fillName(
          otherData.modifierGroupName,
        );
        await menuManagement.modifierGroupEditor.setRequired();
        await menuManagement.modifierGroupEditor.selectType(
          ModifierSelectionType.SINGLE,
        );
        await menuManagement.modifierGroupEditor.addOption();
        await menuManagement.modifierGroupEditor.fillOptionName(
          otherData.modifierName,
        );
        await menuManagement.modifierGroupEditor.setOptionPrice("0");
        await menuManagement.modifierGroupEditor.setOptionDefault();
        await menuManagement.modifierGroupEditor.save();
        await menuManagement.assignments.openCategory(otherData.categoryName);
        await menuManagement.assignments.selectGroup(
          otherData.modifierGroupName,
        );
        await menuManagement.assignments.save();
        await backOfficeAuth.form.signOut();
        await publicMenu.open(e2eEnvironment.frontOfficeUrl);
        await publicMenu.product.openCategory(otherData.categoryName);
        await publicMenu.product.openProduct(otherData);
        await publicMenu.product.selectVariant(ProductConfiguratorSize.M);
        await publicMenu.product.selectModifier(otherData.modifierName);
        await publicMenu.product.addToCart();
        await checkout.cart.open();
        await checkout.cart.setQuantity(
          otherData.productName,
          otherData.productQuantity,
        );
        await checkout.cart.startCheckout();
        await checkout.phoneVerification.fillPhone(
          e2eCredentials.customer.phone,
        );
        await checkout.phoneVerification.requestCode();
        await checkout.phoneVerification.fillCode(e2eCredentials.customer.otp);
        await checkout.phoneVerification.confirm();
        await checkout.profile.completeProfileIfShown(otherData.customerName);
        await checkout.cart.placeOrder();
        return customerOrder.details.readSnapshot();
      });
    await test.step("Подготовка: staff входит в back-office и открывает очередь.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.staff);
      await staffOrders.open();
    });
    await staffOrders.queue.searchByNumber(targetOrder.number);
    await test.step("Поиск показывает карточку заказа с введённым номером.", async () => {
      await staffOrders.queue.assertOrderVisible(targetOrder);
    });
    await test.step("Карточки с другими номерами не показаны во время поиска.", async () => {
      await staffOrders.queue.assertOrderHidden(otherOrder);
    });
    await staffOrders.queue.clearSearch();
    await test.step("После очистки поиска очередь снова показывает все подготовленные заказы.", async () => {
      await staffOrders.queue.assertOrderVisible(targetOrder);
      await staffOrders.queue.assertOrderVisible(otherOrder);
    });
  } finally {
    await test.step("Очистка: administrator удаляет созданные позиции каталога через UI.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(
        targetData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(
        targetData.productName,
      );
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        targetData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        targetData.categoryName,
      );
      await menuManagement.catalog.expandCategoryIfPresent(
        otherData.categoryName,
      );
      await menuManagement.productEditor.deleteIfPresent(otherData.productName);
      await menuManagement.modifierGroupEditor.archiveIfPresent(
        otherData.modifierGroupName,
      );
      await menuManagement.categoryEditor.archiveIfPresent(
        otherData.categoryName,
      );
      await backOfficeAuth.form.signOut();
    });
  }
});
