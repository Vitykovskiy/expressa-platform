import { AvailabilityState, expect, ProductType, test } from "@fixtures/test";

/**
 * Назначение: customer устраняет недоступную позицию перед оформлением.
 *
 * Предусловия: customer авторизован; в корзине есть доступная и ставшая недоступной позиции; приём новых заказов открыт.
 *
 * Сценарий:
 * 1. Customer открывает корзину.
 * 2. Customer начинает оформление заказа.
 * 3. Customer удаляет отмеченную недоступной позицию.
 *
 * Ожидаемый результат:
 * - Позиция отмечена как недоступная, а оформление недоступно до её удаления.
 * - После удаления недоступной позиции customer может продолжить оформление с оставшимися доступными позициями.
 */
test("CART-07: customer устраняет недоступную позицию", async ({
  availabilityManagement,
  backOfficeAuth,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  menuManagement,
  publicMenu,
}, testInfo) => {
  const categoryName = `Категория корзины ${testInfo.testId}`;
  const unavailableProductName = `Недоступный товар ${testInfo.testId}`;
  const availableProductName = `Доступный товар ${testInfo.testId}`;

  try {
    await test.step("Подготовка: administrator публикует два доступных товара, а customer добавляет их в корзину.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await menuManagement.open();
      await menuManagement.categoryEditor.startCreation();
      await menuManagement.categoryEditor.fillName(categoryName);
      await menuManagement.categoryEditor.fillDescription(
        "Категория проверки доступности корзины",
      );
      await menuManagement.categoryEditor.save(categoryName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(unavailableProductName);
      await menuManagement.productEditor.setSinglePrice("25000");
      await menuManagement.productEditor.save(unavailableProductName);
      await menuManagement.productEditor.startCreation();
      await menuManagement.productEditor.selectCategory(categoryName);
      await menuManagement.productEditor.selectType(ProductType.OTHER);
      await menuManagement.productEditor.fillName(availableProductName);
      await menuManagement.productEditor.setSinglePrice("25000");
      await menuManagement.productEditor.save(availableProductName);
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
      await publicMenu.product.openCategory(categoryName);
      await publicMenu.product.openProduct(unavailableProductName);
      await publicMenu.product.addToCart();
      await publicMenu.product.openProduct(availableProductName);
      await publicMenu.product.addToCart();
    });
    await test.step("Подготовка: administrator выключает добавленную позицию через управление доступностью.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(unavailableProductName);
      await availabilityManagement.list.setProductAvailability(
        unavailableProductName,
        AvailabilityState.UNAVAILABLE,
      );
      await backOfficeAuth.form.signOut();
      await publicMenu.open(e2eEnvironment.frontOfficeUrl);
    });

    await checkout.cart.open();
    await checkout.cart.requestAvailabilityRevalidation();

    await test.step("Позиция отмечена как недоступная, а оформление недоступно до её удаления.", async () => {
      expect(
        await checkout.cart.isItemUnavailable(unavailableProductName),
        "Недоступная позиция отмечена в корзине.",
      ).toBe(true);
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Оформление недоступно до удаления позиции.",
      ).toBe(false);
    });

    await checkout.cart.remove(unavailableProductName);

    await test.step("После удаления недоступной позиции customer может продолжить оформление с оставшимися доступными позициями.", async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине остаётся доступная позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(availableProductName, undefined, []),
        "В корзине остаётся доступный товар.",
      ).toBe(availableProductName);
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Оформление доступно после удаления недоступной позиции.",
      ).toBe(true);
    });
  } finally {
    await test.step("Очистка: administrator возвращает доступность и удаляет данные сценария.", async () => {
      await backOfficeAuth.open(e2eEnvironment.backOfficeUrl);
      await backOfficeAuth.form.signIn(e2eCredentials.administrator);
      await availabilityManagement.open();
      await availabilityManagement.list.search(unavailableProductName);
      await availabilityManagement.list.setProductAvailability(
        unavailableProductName,
        AvailabilityState.AVAILABLE,
      );
      await menuManagement.open();
      await menuManagement.catalog.expandCategoryIfPresent(categoryName);
      await menuManagement.productEditor.deleteIfPresent(
        unavailableProductName,
      );
      await menuManagement.productEditor.deleteIfPresent(availableProductName);
      await menuManagement.categoryEditor.archiveIfPresent(categoryName);
      await backOfficeAuth.form.signOut();
    });
  }
});
