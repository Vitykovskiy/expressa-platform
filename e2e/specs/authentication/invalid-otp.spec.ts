import {
  CustomerSessionState,
  expect,
  PhoneVerificationError,
  test,
} from "@fixtures/test";

/**
 * Назначение: customer получает понятный результат неверного ввода кода и может использовать оставшиеся попытки.
 *
 * Предусловия: customer запросил код для своего номера телефона;
 * срок действия кода не истёк.
 *
 * Сценарий:
 * 1. Customer указывает неверный шестизначный код 111111.
 * 2. Customer подтверждает код.
 * 3. Customer указывает неверный шестизначный код 222222.
 * 4. Customer подтверждает код.
 * 5. Customer указывает неверный шестизначный код 333333.
 * 6. Customer подтверждает код.
 * 7. Customer указывает неверный шестизначный код 444444.
 * 8. Customer подтверждает код.
 * 9. Customer указывает неверный шестизначный код 555555.
 * 10. Customer подтверждает код.
 *
 * Ожидаемый результат:
 * - После каждого неверного кода customer видит сообщение о неверном коде.
 * - Customer не становится авторизованным.
 * - После пятой неверной попытки этот код больше нельзя подтвердить.
 */
test("AUTH-04 — Customer видит результат пяти неверных одноразовых кодов", async ({
  customerAuth,
  e2eCredentials,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone(e2eCredentials.customer.phone);
  await customerAuth.phoneVerification.requestCode();
  await customerAuth.phoneVerification.fillCode("111111");
  await customerAuth.phoneVerification.confirm();
  await test.step("После каждого неверного кода customer видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("222222");
  await customerAuth.phoneVerification.confirm();
  await test.step("После каждого неверного кода customer видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("333333");
  await customerAuth.phoneVerification.confirm();
  await test.step("После каждого неверного кода customer видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("444444");
  await customerAuth.phoneVerification.confirm();
  await test.step("После каждого неверного кода customer видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });
  await customerAuth.phoneVerification.fillCode("555555");
  await customerAuth.phoneVerification.confirm();

  await test.step("После каждого неверного кода customer видит сообщение о неверном коде", async () => {
    await customerAuth.phoneVerification.assertError(
      PhoneVerificationError.INVALID_CODE,
    );
  });

  await test.step("Customer не становится авторизованным", async () => {
    await customerAuth.assertSession(CustomerSessionState.GUEST);
  });

  await test.step("После пятой неверной попытки этот код больше нельзя подтвердить", async () => {
    expect(
      await customerAuth.phoneVerification.isCodeConfirmationDisabled(),
      "Кнопка подтверждения недоступна после пятой неверной попытки.",
    ).toBe(true);
  });
});
