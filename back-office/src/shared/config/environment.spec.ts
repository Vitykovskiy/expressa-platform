import { describe, expect, it } from "vitest";

import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  it("принимает поддерживаемое окружение и абсолютный HTTP URL API", () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "local",
        VITE_API_BASE_URL: "http://localhost:3000",
      }),
    ).not.toThrow();
  });

  it("принимает / для API на текущем origin", () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "development",
        VITE_API_BASE_URL: "/",
      }),
    ).not.toThrow();
  });

  it("отклоняет отсутствующее окружение", () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: undefined,
        VITE_API_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow("Неверная конфигурация: VITE_APP_ENV обязательна.");
  });

  it("отклоняет неподдерживаемое окружение без раскрытия значения", () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "preview",
        VITE_API_BASE_URL: "http://localhost:3000",
      }),
    ).toThrow(
      "Неверная конфигурация: VITE_APP_ENV должна быть local, development, staging или production.",
    );
  });

  it("отклоняет пустой или некорректный адрес API", () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "local",
        VITE_API_BASE_URL: undefined,
      }),
    ).toThrow("Неверная конфигурация: VITE_API_BASE_URL обязательна.");

    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "local",
        VITE_API_BASE_URL: "   ",
      }),
    ).toThrow("Неверная конфигурация: VITE_API_BASE_URL обязательна.");

    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: "local",
        VITE_API_BASE_URL: "ftp://example.test",
      }),
    ).toThrow(
      "Неверная конфигурация: VITE_API_BASE_URL должна быть / или абсолютным HTTP(S) URL.",
    );
  });

  it("отклоняет абсолютный адрес API с путем, параметрами, фрагментом или учетными данными", () => {
    const invalidApiBaseUrls = [
      "https://api.example.test/service",
      "https://api.example.test/?source=app",
      "https://api.example.test/#section",
      "https://user:password@api.example.test/",
    ];

    for (const apiBaseUrl of invalidApiBaseUrls) {
      expect(() =>
        validateEnvironment({
          VITE_APP_ENV: "development",
          VITE_API_BASE_URL: apiBaseUrl,
        }),
      ).toThrow(
        "Неверная конфигурация: VITE_API_BASE_URL должна быть / или абсолютным HTTP(S) URL.",
      );
    }
  });
});
