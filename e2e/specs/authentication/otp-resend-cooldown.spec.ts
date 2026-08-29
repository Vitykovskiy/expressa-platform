import {
  PhoneVerificationError,
  PhoneVerificationStep,
  test,
} from "@fixtures/test";

/**
 * Назначение: клиент получает понятный результат повторного запроса кода до разрешённого срока.
 *
 * Предусловия: тестовое окружение предоставляет номер клиента и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает номер телефона.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент повторно запрашивает одноразовый код.
 *
 * Ожидаемый результат:
 * - Клиент видит сообщение об ограничении повторной отправки кода.
 * - Клиент остаётся на шаге ввода кода.
 */
test("AUTH-06 — Клиент видит ограничение повторной отправки кода", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.resendCode();

  await test.step("Клиент видит сообщение об ограничении повторной отправки кода", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.RESEND_COOLDOWN,
    );
  });

  await test.step("Клиент остаётся на шаге ввода кода", async () => {
    await customerAuth.phoneVerification.assertStep(PhoneVerificationStep.OTP);
  });
});
