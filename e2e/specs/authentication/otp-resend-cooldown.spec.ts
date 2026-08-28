import {
  PhoneVerificationError,
  PhoneVerificationStep,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer получает понятный результат повторного запроса кода до разрешённого срока.
 *
 * Предусловия: customer запросил код для своего номера телефона менее 60 секунд назад;
 * customer находится на шаге ввода одноразового кода.
 *
 * Сценарий:
 * 1. Customer пытается повторно отправить одноразовый код.
 *
 * Ожидаемый результат:
 * - Customer видит сообщение об ограничении повторной отправки кода.
 * - Customer остаётся на шаге ввода кода.
 */
test("AUTH-06 — Customer видит ограничение повторной отправки кода", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.resendCode();

  await test.step("Customer видит сообщение об ограничении повторной отправки кода", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.RESEND_COOLDOWN,
    );
  });

  await test.step("Customer остаётся на шаге ввода кода", async () => {
    await customerAuth.phoneVerification.assertStep(PhoneVerificationStep.OTP);
  });
});
