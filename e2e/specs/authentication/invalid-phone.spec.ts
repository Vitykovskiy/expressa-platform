import { PhoneVerificationStep, test } from "@fixtures/test";

/**
 * Назначение: customer не может запросить код для неполного российского номера.
 *
 * Предусловия: customer находится на форме входа.
 *
 * Сценарий:
 * 1. Customer указывает неполный российский номер телефона.
 *
 * Ожидаемый результат:
 * - Customer остаётся на шаге ввода номера.
 * - Кнопка запроса одноразового кода недоступна.
 */
test("AUTH-03 — Customer не запрашивает код для неполного номера", async ({
  customerAuth,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone("+7 999 123-45");

  await test.step("Customer остаётся на шаге ввода номера", async () => {
    await customerAuth.phoneVerification.assertStep(
      PhoneVerificationStep.PHONE,
    );
  });

  await test.step("Кнопка запроса одноразового кода недоступна", async () => {
    await customerAuth.phoneVerification.assertCodeRequestDisabled();
  });
});
