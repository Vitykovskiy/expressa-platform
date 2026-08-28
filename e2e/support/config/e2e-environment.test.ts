import { expect, test } from "@playwright/test";

import {
  E2E_ADMIN_OTP_ENVIRONMENT_VARIABLE,
  E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
  E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_OTP_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
  E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_STAFF_OTP_ENVIRONMENT_VARIABLE,
  E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
} from "./e2e-environment.constants";
import { getE2eCredentials, getE2eEnvironment } from "./e2e-environment";

let initialE2eEnvironment: ReadonlyMap<string, string>;

test.beforeEach(() => {
  initialE2eEnvironment = new Map(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        entry[0].startsWith("E2E_") && entry[1] !== undefined,
    ),
  );
});

test.afterEach(() => {
  for (const name of Object.keys(process.env)) {
    if (name.startsWith("E2E_")) {
      delete process.env[name];
    }
  }

  for (const [name, value] of initialE2eEnvironment) {
    process.env[name] = value;
  }
});

test.describe("Окружение E2E", () => {
  test("требует адреса обоих тестируемых приложений", () => {
    delete process.env[E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE];
    delete process.env[E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE];

    expect(
      () => getE2eEnvironment(),
      "Сценарий окружения: без адреса front-office запуск невозможен.",
    ).toThrow(`${E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE} is required.`);

    process.env[E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE] =
      "https://front-office.example.test";
    expect(
      () => getE2eEnvironment(),
      "Сценарий окружения: без адреса back-office запуск невозможен.",
    ).toThrow(`${E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE} is required.`);
  });

  test("принимает абсолютные HTTP(S) адреса", () => {
    process.env[E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE] =
      "https://front-office.example.test/path";
    process.env[E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE] =
      "http://back-office.example.test";

    expect(
      getE2eEnvironment(),
      "Сценарий окружения: адреса приложений считываются.",
    ).toEqual({
      frontOfficeUrl: "https://front-office.example.test/path",
      backOfficeUrl: "http://back-office.example.test/",
    });
  });

  test("отклоняет пустой, относительный и не-HTTP(S) адрес", () => {
    process.env[E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE] =
      "https://back-office.example.test";

    for (const frontOfficeUrl of [
      "",
      "   ",
      "/login",
      "ftp://front-office.example.test",
    ]) {
      process.env[E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE] = frontOfficeUrl;
      expect(
        () => getE2eEnvironment(),
        "Сценарий окружения: недопустимый адрес front-office отклоняется.",
      ).toThrow();
    }
  });

  test("отклоняет credentials, query и fragment в адресе", () => {
    process.env[E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE] =
      "https://back-office.example.test";

    for (const frontOfficeUrl of [
      "https://user:password@front-office.example.test",
      "https://front-office.example.test?filter=value",
      "https://front-office.example.test#section",
    ]) {
      process.env[E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE] = frontOfficeUrl;
      expect(
        () => getE2eEnvironment(),
        "Сценарий окружения: адрес с credentials, query или fragment отклоняется.",
      ).toThrow();
    }
  });

  test("требует и проверяет отдельные учётные данные customer", () => {
    const phoneValues: Readonly<Record<string, string>> = {
      [E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE]: "+7 999 000-00-01",
      [E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE]: "+7 999 000-00-02",
      [E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE]: "+7 999 000-00-03",
      [E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE]: "+7 999 000-00-04",
    };

    process.env[E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE] =
      phoneValues[E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE];
    process.env[E2E_ADMIN_OTP_ENVIRONMENT_VARIABLE] = "123456";
    process.env[E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE] =
      phoneValues[E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE];
    process.env[E2E_STAFF_OTP_ENVIRONMENT_VARIABLE] = "123456";
    process.env[E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE] =
      phoneValues[E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE];
    process.env[E2E_CUSTOMER_OTP_ENVIRONMENT_VARIABLE] = "123456";
    delete process.env[E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE];
    delete process.env[E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE];

    expect(
      () => getE2eCredentials(),
      "Сценарий окружения: без второго customer запуск невозможен.",
    ).toThrow(`${E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE} is required.`);

    process.env[E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE] =
      phoneValues[E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE];
    process.env[E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE] = "654321";

    expect(
      getE2eCredentials().secondCustomer,
      "Сценарий окружения: учётные данные второго customer считываются.",
    ).toEqual({
      phone: phoneValues[E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE],
      otp: "654321",
    });

    process.env[E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE] = "65432";
    expect(
      () => getE2eCredentials(),
      "Сценарий окружения: некорректный код второго customer отклоняется.",
    ).toThrow(
      `${E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE} must contain exactly six digits.`,
    );

    process.env[E2E_CUSTOMER_2_OTP_ENVIRONMENT_VARIABLE] = "654321";
    for (const [firstName, secondName, firstRole, secondRole] of [
      [
        E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
        E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
        "administrator",
        "staff",
      ],
      [
        E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
        E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
        "administrator",
        "customer",
      ],
      [
        E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
        E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE,
        "administrator",
        "secondCustomer",
      ],
      [
        E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
        E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
        "staff",
        "customer",
      ],
      [
        E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
        E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE,
        "staff",
        "secondCustomer",
      ],
      [
        E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
        E2E_CUSTOMER_2_PHONE_ENVIRONMENT_VARIABLE,
        "customer",
        "secondCustomer",
      ],
    ]) {
      process.env[secondName] = process.env[firstName];

      expect(
        () => getE2eCredentials(),
        `Сценарий окружения: ${secondRole} не использует номер ${firstRole}.`,
      ).toThrow(
        `Phone credentials for ${firstRole} and ${secondRole} must be distinct.`,
      );

      process.env[secondName] = phoneValues[secondName];
    }
  });
});
