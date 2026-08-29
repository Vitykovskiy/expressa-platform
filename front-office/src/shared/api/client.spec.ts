import { describe, expect, it, vi } from "vitest";

import { ApiClient, ApiError, createApiClient } from "./client";

describe("ApiClient", () => {
  it("преобразует ошибку API в единый объект ошибки", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v2",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            code: "AUTH_CODE_INVALID",
            details: { attemptsLeft: 2 },
            message: "Код не принят.",
            requestId: "request-42",
          }),
          { status: 400 },
        ),
    });

    await expect(client.request("/auth/code", isString)).rejects.toMatchObject({
      code: "AUTH_CODE_INVALID",
      details: { attemptsLeft: 2 },
      message: "Код не принят.",
      requestId: "request-42",
    } satisfies Partial<ApiError>);
  });

  it("сообщает о нарушении формата ошибки API", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v2",
      fetcher: async () =>
        new Response(JSON.stringify({ message: "Ошибка." }), { status: 500 }),
    });

    await expect(client.request("/orders", isString)).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      message: "Сервер вернул ошибку, не соответствующую контракту API.",
    } satisfies Partial<ApiError>);
  });

  it("принимает ожидаемый 202", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetcher: async () => new Response(JSON.stringify("ok"), { status: 202 }),
    });
    await expect(
      client.request("/otp", isString, { expectedStatus: 202 }),
    ).resolves.toBe("ok");
  });

  it("отклоняет другой 2xx при expectedStatus", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetcher: async () => new Response(JSON.stringify("ok"), { status: 200 }),
    });
    await expect(
      client.request("/otp", isString, { expectedStatus: 202 }),
    ).rejects.toMatchObject({ code: "API_CONTRACT_ERROR", status: 200 });
  });

  it.each([401, 503])("сохраняет status %i для non-2xx", async (status) => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            code: "ACCESS_DENIED",
            details: null,
            message: "Denied",
            requestId: null,
          }),
          { status },
        ),
    });
    await expect(client.request("/orders", isString)).rejects.toMatchObject({
      status,
    });
  });

  it("сохраняет null status для network error", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetcher: async () => {
        throw new Error("offline");
      },
    });
    await expect(client.request("/orders", isString)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: null,
    });
  });

  it("возвращает undefined для 204 без JSON parsing", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetcher: async () => new Response(null, { status: 204 }),
    });
    await expect(
      client.request(
        "/logout",
        (value): value is undefined => value === undefined,
        { expectedStatus: 204 },
      ),
    ).resolves.toBeUndefined();
  });

  it("вызывает fetch с глобальным receiver", async () => {
    const receiverSensitiveFetcher = vi.fn(function (this: typeof globalThis) {
      if (this !== globalThis) {
        throw new TypeError("fetch должен вызываться с globalThis.");
      }

      return Promise.resolve(new Response(JSON.stringify("ok")));
    }) as unknown as typeof fetch;
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v2",
      fetcher: receiverSensitiveFetcher,
    });

    await expect(client.request("/orders", isString)).resolves.toBe("ok");
  });

  it("добавляет /api/v2 к проверенному базовому URL без двойных слешей", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("https://api.example.test/", fetcher);

    await client.request("/orders", isString);

    expect(requestedUrl).toBe("https://api.example.test/api/v2/orders");
  });

  it("создаёт same-origin URL с /api/v2 без двойных слешей", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("/", fetcher);

    await client.request("/orders", isString);

    expect(requestedUrl).toBe("/api/v2/orders");
  });

  it("сохраняет кодирование и query/hash в same-origin URL", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("/", fetcher);

    await client.request("/заказы/с пробелом?фильтр=новый#итог", isString);

    expect(requestedUrl).toBe(
      "/api/v2/%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D1%8B/%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%BE%D0%BC?%D1%84%D0%B8%D0%BB%D1%8C%D1%82%D1%80=%D0%BD%D0%BE%D0%B2%D1%8B%D0%B9#%D0%B8%D1%82%D0%BE%D0%B3",
    );
  });

  it("отклоняет protocol-relative базовый URL API", () => {
    expect(() => createApiClient("//evil.example.test")).toThrow(
      "Неверная конфигурация: VITE_API_BASE_URL не может быть protocol-relative URL.",
    );
  });
});

function isString(value: unknown): value is string {
  return typeof value === "string";
}
