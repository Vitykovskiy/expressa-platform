import {
  CustomerSessionState,
  PhoneVerificationError,
  PhoneVerificationStep,
  test,
} from "@fixtures/test";

/**
 * Назначение: клиент получает понятный результат неверного ввода одноразового кода.
 *
 * Предусловия: тестовое окружение предоставляет номер клиента и одноразовый код.
 *
 * Сценарий:
 * 1. Клиент открывает форму входа.
 * 2. Клиент указывает номер телефона.
 * 3. Клиент запрашивает одноразовый код.
 * 4. Клиент указывает неверный шестизначный код 111111.
 * 5. Клиент подтверждает код.
 * 6. Клиент указывает неверный шестизначный код 222222.
 * 7. Клиент подтверждает код.
 * 8. Клиент указывает неверный шестизначный код 333333.
 * 9. Клиент подтверждает код.
 * 10. Клиент указывает неверный шестизначный код 444444.
 * 11. Клиент подтверждает код.
 * 12. Клиент указывает неверный шестизначный код 555555.
 * 13. Клиент подтверждает код.
 * 14. Клиент указывает настроенный корректный одноразовый код.
 * 15. Клиент подтверждает код.
 *
 * Ожидаемый результат:
 * - После первого неверного кода клиент видит сообщение о неверном коде.
 * - После второго неверного кода клиент видит сообщение о неверном коде.
 * - После третьего неверного кода клиент видит сообщение о неверном коде.
 * - После четвёртого неверного кода клиент видит сообщение о неверном коде.
 * - После пятого неверного кода клиент видит сообщение о неверном коде.
 * - Клиент не становится авторизованным.
 * - После пятой неверной попытки настроенный корректный код остаётся недоступным.
 */
test("AUTH-04 — Клиент видит результат пяти неверных одноразовых кодов", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode("111111");
  await customerAuth.phoneVerification.confirmInvalidCode();
  await test.step("После первого неверного кода клиент видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("222222");
  await customerAuth.phoneVerification.confirmInvalidCode();
  await test.step("После второго неверного кода клиент видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("333333");
  await customerAuth.phoneVerification.confirmInvalidCode();
  await test.step("После третьего неверного кода клиент видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("444444");
  await customerAuth.phoneVerification.confirmInvalidCode();
  await test.step("После четвёртого неверного кода клиент видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("555555");
  await customerAuth.phoneVerification.confirmInvalidCode();
  await test.step("После пятого неверного кода клиент видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode(e2eCredentials.customer.otp);
  await customerAuth.phoneVerification.confirmInvalidCode();

  await test.step("Клиент не становится авторизованным", async () => {
    await customerAuth.assertSession(CustomerSessionState.GUEST);
  });

  await test.step("После пятой неверной попытки настроенный корректный код остаётся недоступным", async () => {
    await customerAuth.phoneVerification.assertStep(PhoneVerificationStep.OTP);
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
});
