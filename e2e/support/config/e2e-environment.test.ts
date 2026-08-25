import { expect, test } from "@playwright/test";

import {
  E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE,
} from "./e2e-environment.constants";
import { getE2eEnvironment } from "./e2e-environment";

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
});
