import { PhoneVerificationStep, test } from "@fixtures/test";

/**
 * Назначение: клиент не может запросить код для неполного российского номера.
 *
 * Предусловия: изолированный профиль доступен для входа клиента.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает неполный российский номер телефона.
 *
 * Ожидаемый результат:
 * - Клиент остаётся на шаге ввода номера.
 * - Кнопка запроса одноразового кода недоступна.
 */
test("AUTH-03 — Клиент не запрашивает код для неполного номера", async ({
  customerAuth,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone("+7 999 123-45");

  await test.step("Клиент остаётся на шаге ввода номера", async () => {
    await customerAuth.phoneVerification.assertStep(
      PhoneVerificationStep.PHONE,
    );
  });

  await test.step("Кнопка запроса одноразового кода недоступна", async () => {
    await customerAuth.phoneVerification.assertCodeRequestDisabled();
  });
});
