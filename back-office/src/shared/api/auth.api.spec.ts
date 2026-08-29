import { describe, expect, it, vi } from "vitest";

import { AuthApi } from "./auth.api";
import { ApiClient, ApiError } from "./client";

function createAuthApi(fetcher: typeof fetch): AuthApi {
  return new AuthApi(
    new ApiClient({ baseUrl: "https://api.example.test/api/v2", fetcher }),
  );
}

describe("AuthApi", () => {
  it("запрашивает OTP по каноническому пути, с cookie и статусом 202", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ expiresInSeconds: 300, retryAfterSeconds: 60 }),
          { status: 202 },
        ),
      );
    const api = createAuthApi(fetcher);

    await expect(api.requestOtp("+79123456789")).resolves.toEqual({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/auth/otp/request",
      expect.objectContaining({
        body: JSON.stringify({ phone: "+79123456789" }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("отклоняет неверный успешный статус запроса OTP", async () => {
    const api = createAuthApi(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ expiresInSeconds: 300, retryAfterSeconds: 60 }),
            { status: 200 },
          ),
        ),
    );

    await expect(api.requestOtp("+79123456789")).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });

  it("проверяет код и возвращает только Bearer access response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "access-token",
          expiresInSeconds: 900,
          tokenType: "Bearer",
        }),
        { status: 200 },
      ),
    );
    const api = createAuthApi(fetcher);

    await expect(api.verifyOtp("+79123456789", "123456")).resolves.toEqual({
      accessToken: "access-token",
      expiresInSeconds: 900,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/auth/otp/verify",
      expect.objectContaining({
        body: JSON.stringify({ code: "123456", phone: "+79123456789" }),
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("обновляет access token через refresh-cookie", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "access-token",
          expiresInSeconds: 900,
          tokenType: "Bearer",
        }),
        { status: 200 },
      ),
    );
    const api = createAuthApi(fetcher);

    await expect(api.refresh()).resolves.toEqual({
      accessToken: "access-token",
      expiresInSeconds: 900,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/auth/refresh",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  it("завершает сессию только через 204 с cookie", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const api = createAuthApi(fetcher);

    await expect(api.logout()).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/auth/logout",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  it("читает /me с централизованным Bearer и отклоняет неизвестную роль", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "user-id",
            phoneE164: "+79123456789",
            role: "barista",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "user-id",
            phoneE164: "+79123456789",
            role: "owner",
          }),
          { status: 200 },
        ),
      );
    const api = createAuthApi(fetcher);

    await expect(api.getCurrentUser("access-token")).resolves.toEqual({
      id: "user-id",
      phoneE164: "+79123456789",
      role: "barista",
    });
    await expect(api.getCurrentUser("access-token")).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/me",
      expect.objectContaining({
        headers: { authorization: "Bearer access-token" },
        method: "GET",
      }),
    );
  });
});
