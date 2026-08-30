import { PhoneVerificationStep, test } from "@fixtures/test";
import { expectedResult } from "@fixtures/test";

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
  page,
  customerAuth,
  e2eEnvironment,
}) => {
  await customerAuth.open(e2eEnvironment.frontOfficeUrl);
  await customerAuth.phoneVerification.fillPhone("+7 999 123-45");

  await expectedResult(
    "Клиент остаётся на шаге ввода номера",
    page,
    async () => {
      await customerAuth.phoneVerification.assertStep(
        PhoneVerificationStep.PHONE,
      );
    },
  );

  await expectedResult(
    "Кнопка запроса одноразового кода недоступна",
    page,
    async () => {
      await customerAuth.phoneVerification.assertCodeRequestDisabled();
    },
  );
});
