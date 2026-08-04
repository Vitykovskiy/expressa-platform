import { describe, expect, it } from "vitest";
import { ApiClient, ApiError } from "./client";
import { createAuthApi } from "./auth.api";

function client(response: Response, capture: RequestInit[] = []): ApiClient {
  return new ApiClient({
    baseUrl: "https://api.example.test/api/v1",
    fetcher: async (_url, options) => {
      capture.push(options ?? {});
      return response;
    },
  });
}

describe("AuthApi", () => {
  it("отправляет OTP request exact POST 202 body", async () => {
    const calls: RequestInit[] = [];
    await expect(
      createAuthApi(
        client(
          new Response(
            JSON.stringify({ expiresInSeconds: 300, retryAfterSeconds: 60 }),
            { status: 202 },
          ),
          calls,
        ),
      ).requestOtp("+79991234567"),
    ).resolves.toEqual({ expiresInSeconds: 300, retryAfterSeconds: 60 });
    expect(calls[0]).toMatchObject({
      body: JSON.stringify({ phone: "+79991234567" }),
      method: "POST",
    });
  });

  it("uses credentials for verify, refresh and logout; Bearer only for /me", async () => {
    const calls: RequestInit[] = [];
    await createAuthApi(
      client(
        new Response(
          JSON.stringify({
            accessToken: "token",
            expiresInSeconds: 900,
            tokenType: "Bearer",
          }),
          { status: 200 },
        ),
        calls,
      ),
    ).verifyOtp("+79991234567", "123456");
    await createAuthApi(
      client(
        new Response(
          JSON.stringify({
            accessToken: "token",
            expiresInSeconds: 900,
            tokenType: "Bearer",
          }),
          { status: 200 },
        ),
        calls,
      ),
    ).refresh();
    await expect(
      createAuthApi(
        client(new Response(null, { status: 204 }), calls),
      ).logout(),
    ).resolves.toBeUndefined();
    await expect(
      createAuthApi(
        client(
          new Response(
            JSON.stringify({
              id: "id",
              phoneE164: "+79991234567",
              role: "customer",
            }),
            { status: 200 },
          ),
          calls,
        ),
      ).getCurrentUser("access"),
    ).resolves.toMatchObject({ role: "customer" });
    expect(calls.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ credentials: "include" }),
      ]),
    );
    expect(calls[3]).toMatchObject({
      headers: { authorization: "Bearer access" },
      method: "GET",
    });
  });

  it.each([
    {},
    { accessToken: "x", expiresInSeconds: 900, tokenType: "Basic" },
    { id: "x", phoneE164: "+7", role: "owner" },
  ])("rejects malformed auth response %o", async (body) => {
    await expect(
      createAuthApi(
        client(new Response(JSON.stringify(body), { status: 200 })),
      ).refresh(),
    ).rejects.toMatchObject({
      code: "API_CONTRACT_ERROR",
    } satisfies Partial<ApiError>);
  });
});
