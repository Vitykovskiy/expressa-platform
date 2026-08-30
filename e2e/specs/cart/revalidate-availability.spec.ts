import {
  AvailabilityItemType,
  AvailabilityState,
  expect,
  ProductConfiguratorSize,
  test,
} from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

/**
 * Назначение: full journey актуализации доступности позиции в сформированной через UI корзине.
 * Связанные capabilities: добавление позиций в корзину, изменение доступности товара, актуализация доступности и удаление недоступной позиции.
 *
 * Предусловия: изолированный запуск `mutating` с seed scenario `canonical` содержит опубликованные доступные «Капучино» и «Эспрессо» в категории «Кофе»; тестовое окружение предоставляет administrator и OTP customer; корзина нового browser context пуста.
 *
 * Сценарий:
 * 1. Customer открывает публичное меню.
 * 2. Customer открывает категорию «Кофе».
 * 3. Customer открывает «Капучино».
 * 4. Customer добавляет исходную конфигурацию в корзину.
 * 5. Customer открывает «Эспрессо».
 * 6. Customer добавляет исходную конфигурацию в корзину.
 * 7. Administrator открывает форму входа back-office.
 * 8. Administrator вводит номер телефона.
 * 9. Administrator запрашивает одноразовый код.
 * 10. Administrator вводит одноразовый код.
 * 11. Administrator подтверждает вход.
 * 12. Administrator открывает управление доступностью.
 * 13. Administrator ищет «Капучино».
 * 14. Administrator выключает «Капучино».
 * 15. Customer открывает публичное меню.
 * 16. Customer открывает корзину.
 * 17. Customer начинает оформление для проверки доступности.
 * 18. Customer удаляет отмеченный недоступным «Капучино».
 *
 * Ожидаемый результат:
 * - «Капучино» отмечен как недоступный, а оформление недоступно до его удаления.
 * - После удаления «Капучино» customer может продолжить оформление с «Эспрессо».
 */
test("CART-07: customer устраняет недоступную позицию", async ({
  page,
  checkout,
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
  multiSession,
  publicMenu,
}) => {
  await test.step("Подготовка: customer авторизуется.", async () => {
    await customerAuth.open(e2eEnvironment.frontOfficeUrl);
    await customerAuth.phoneVerification.fillPhone(
      e2eCredentials.customer.phone,
    );
    await customerAuth.phoneVerification.requestCode();
    await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
    await customerAuth.phoneVerification.confirm();
  });
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await publicMenu.product.openCategory("Кофе");
  await publicMenu.product.openProduct("Капучино");
  await publicMenu.product.addToCart();
  await publicMenu.product.openProduct("Эспрессо");
  await publicMenu.product.addToCart();
  await multiSession.staff.auth.open(e2eEnvironment.backOfficeUrl);
  await multiSession.staff.auth.form.fillPhone(
    e2eCredentials.administrator.phone,
  );
  await multiSession.staff.auth.form.requestCode();
  await multiSession.staff.auth.form.fillCode(e2eCredentials.administrator.otp);
  await multiSession.staff.auth.form.confirmCode();
  await multiSession.staff.availabilityManagement.open();
  await multiSession.staff.availabilityManagement.list.search("Капучино");
  await multiSession.staff.availabilityManagement.list.setItemAvailability(
    "Капучино",
    AvailabilityItemType.PRODUCT,
    AvailabilityState.UNAVAILABLE,
  );
  await publicMenu.open(e2eEnvironment.frontOfficeUrl);
  await checkout.cart.open();
  await checkout.cart.requestAvailabilityRevalidation();

  await expectedResult(
    "«Капучино» отмечен как недоступный, а оформление недоступно до его удаления.",
    page,
    async () => {
      expect(
        await checkout.cart.isItemUnavailable(
          "Капучино",
          ProductConfiguratorSize.M,
          ["Обычное молоко"],
        ),
        "Капучино отмечен как недоступный.",
      ).toBe(true);
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Оформление недоступно до удаления капучино.",
      ).toBe(false);
    },
  );
  await checkout.cart.remove("Капучино", ProductConfiguratorSize.M, [
    "Обычное молоко",
  ]);
  await expectedResult(
    "После удаления «Капучино» customer может продолжить оформление с «Эспрессо».",
    page,
    async () => {
      expect(
        await checkout.cart.readItemsCount(),
        "В корзине остаётся одна позиция.",
      ).toBe(1);
      expect(
        await checkout.cart.readItemName(
          "Эспрессо",
          ProductConfiguratorSize.S,
          ["Обычное молоко"],
        ),
        "В корзине остаётся доступный эспрессо.",
      ).toBe("Эспрессо");
      expect(
        await checkout.cart.isCheckoutEnabled(),
        "Оформление доступно после удаления капучино.",
      ).toBe(true);
    },
  );
});
