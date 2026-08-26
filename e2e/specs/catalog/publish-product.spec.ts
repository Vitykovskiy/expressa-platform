import { test } from "@fixtures/test";
import { createProductOrderScenarioData } from "@support/data/product-order-scenario-data";

/**
 * Назначение: подтвердить публикацию и UI-очистку уникального товара.
 *
 * Предусловия: администратор может войти в back-office; публичное меню доступно.
 *
 * Сценарий: администратор публикует конфигурацию товара, клиент добавляет её в корзину,
 * затем администратор архивирует созданные данные.
 *
 * Контрольные точки: опубликованный товар доступен клиенту; после очистки данные
 * сценария отсутствуют в меню управления.
 *
 * Ожидаемый результат: публичное меню содержит только опубликованную конфигурацию,
 * а UI-очистка удаляет её из управления каталогом.
 */
test("Администратор публикует публичную конфигурацию и архивирует уникальный товар", async ({
  backOfficeAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const data = createProductOrderScenarioData(testInfo.testId);

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  await menuManagement.categoryEditor.create(data);
  await menuManagement.productEditor.create(data);
  await menuManagement.catalog.expandCategory(data.categoryName);
  await menuManagement.catalog.assertProductVisible(data.productName);
  await menuManagement.modifierGroupEditor.create(data);
  await menuManagement.assignments.assign(
    data.categoryName,
    data.modifierGroupName,
  );
  await backOfficeAuth.form.signOut();

  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory(data.categoryName);
  await publicMenu.product.openProduct(data);
  await publicMenu.product.selectVariant(data.productSize);
  await publicMenu.product.selectModifier(data.modifierName);
  await publicMenu.product.addToCart();

  await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
  await backOfficeAuth.form.signIn(e2eCredentials.administrator);
  await menuManagement.open();
  await menuManagement.productEditor.reopen(data);
  await menuManagement.productEditor.archive(data.productName);
  await menuManagement.modifierGroupEditor.archive(data.modifierGroupName);
  await menuManagement.categoryEditor.archive(data.categoryName);
  await menuManagement.catalog.assertScenarioAbsent(data);
  await backOfficeAuth.form.signOut();
});
