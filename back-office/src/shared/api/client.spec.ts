import { describe, expect, it, vi } from "vitest";

import { ApiClient, ApiError, createApiClient } from "./client";

describe("ApiClient", () => {
  it("преобразует ошибку API в единый объект ошибки и не возвращает подтверждение", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            code: "AVAILABILITY_UPDATE_REJECTED",
            details: { field: "acceptingOrders" },
            message: "Изменение не принято.",
            requestId: "request-42",
          }),
          { status: 401 },
        ),
    });

    await expect(
      client.request("/availability", isString),
    ).rejects.toMatchObject({
      code: "AVAILABILITY_UPDATE_REJECTED",
      details: { field: "acceptingOrders" },
      message: "Изменение не принято.",
      requestId: "request-42",
      status: 401,
    } satisfies Partial<ApiError>);
  });

  it("сообщает о нарушении формата успешного ответа API", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () =>
        new Response(JSON.stringify({ accepted: true }), { status: 200 }),
    });

    await expect(client.request("/queue", isString)).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      message: "Сервер вернул ответ, не соответствующий контракту API.",
    } satisfies Partial<ApiError>);
  });

  it("принимает ожидаемый статус 202", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () =>
        new Response(JSON.stringify("accepted"), { status: 202 }),
    });

    await expect(
      client.request("/availability", isString, { expectedStatus: 202 }),
    ).resolves.toBe("accepted");
  });

  it("преобразует несовпадение ожидаемого успешного статуса в ошибку контракта", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () => new Response(JSON.stringify("ok"), { status: 200 }),
    });

    await expect(
      client.request("/availability", isString, { expectedStatus: [202] }),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      details: "ok",
      message: "Сервер вернул неожиданный статус ответа.",
      status: 200,
    } satisfies Partial<ApiError>);
  });

  it("сохраняет статус 503 для ошибки с некорректным телом", async () => {
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () =>
        new Response(JSON.stringify({ message: "Сбой." }), { status: 503 }),
    });

    await expect(
      client.request("/availability", isString),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("не разбирает JSON в ответе 204", async () => {
    const response = new Response(null, { status: 204 });
    const parseJson = vi.spyOn(response, "json");
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: async () => response,
    });

    await expect(
      client.request("/availability", isUndefined, { expectedStatus: 204 }),
    ).resolves.toBeUndefined();
    expect(parseJson).not.toHaveBeenCalled();
  });

  it("вызывает fetch с глобальным receiver", async () => {
    const receiverSensitiveFetcher = vi.fn(function (this: typeof globalThis) {
      if (this !== globalThis) {
        throw new TypeError("fetch должен вызываться с globalThis.");
      }

      return Promise.resolve(new Response(JSON.stringify("ok")));
    }) as unknown as typeof fetch;
    const client = new ApiClient({
      baseUrl: "https://api.example.test/api/v1",
      fetcher: receiverSensitiveFetcher,
    });

    await expect(client.request("/queue", isString)).resolves.toBe("ok");
  });

  it("сохраняет абсолютный origin и добавляет /api/v1 без двойных слешей", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("https://api.example.test/", fetcher);

    await client.request("/queue", isString);

    expect(requestedUrl).toBe("https://api.example.test/api/v1/queue");
  });

  it("создаёт same-origin URL с /api/v1 без двойных слешей", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("/", fetcher);

    await client.request("/queue", isString);

    expect(requestedUrl).toBe("/api/v1/queue");
  });

  it("кодирует путь и параметры same-origin URL по правилам URL", async () => {
    let requestedUrl = "";
    const response = new Response(JSON.stringify("ok"));

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString();
      return response;
    };

    const client = createApiClient("/", fetcher);

    await client.request("/заказы с чаем?поиск=зелёный чай", isString);

    expect(requestedUrl).toBe(
      "/api/v1/%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D1%8B%20%D1%81%20%D1%87%D0%B0%D0%B5%D0%BC?%D0%BF%D0%BE%D0%B8%D1%81%D0%BA=%D0%B7%D0%B5%D0%BB%D1%91%D0%BD%D1%8B%D0%B9%20%D1%87%D0%B0%D0%B9",
    );
  });

  it("отклоняет protocol-relative адрес вместо same-origin URL", () => {
    expect(() => createApiClient("//evil.example.test")).toThrow(
      "Базовый URL API для текущего origin должен быть равен /.",
    );
  });
});

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}
