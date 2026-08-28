import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { AppModule } from "../../src/app.module";
import { clockPort } from "../../src/auth/application/clock.constants";
import type { Clock } from "../../src/auth/application/clock.types";
import { migrateDatabase } from "../../src/platform/database/migrations";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";

const databaseUrl = process.env.DATABASE_URL;
const otp = process.env.AUTH_DEVELOPMENT_OTP ?? "123456";
const createdPhones = new Set<string>();

function phone(): string {
  const value = `+7999${Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, "0")}`;
  createdPhones.add(value);
  return value;
}

function cookie(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (value === null) throw new Error("Refresh cookie is missing");
  const first = value.split(";")[0];
  if (first === undefined) throw new Error("Refresh cookie is malformed");
  return first;
}

function headers(
  requestId: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-request-id": requestId,
    ...extra,
  };
}

describe("auth E2E", () => {
  let app: INestApplication;
  let pool: Pool;
  let url: string;
  let clock: Clock;

  beforeAll(async () => {
    if (databaseUrl === undefined)
      throw new Error("DATABASE_URL is required for e2e tests");
    pool = new Pool({ connectionString: databaseUrl });
    await migrateDatabase(pool, "migrations");
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureHttp(app, "local");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    clock = app.get<Clock>(clockPort);
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    const phones = [...createdPhones];
    createdPhones.clear();
    if (phones.length === 0) return;

    await pool.query(
      `DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE phone_e164 = ANY($1::text[]))`,
      [phones],
    );
    await pool.query(
      "DELETE FROM otp_challenges WHERE phone_e164 = ANY($1::text[])",
      [phones],
    );
    await pool.query("DELETE FROM users WHERE phone_e164 = ANY($1::text[])", [
      phones,
    ]);
  });

  async function requestOtp(value: string): Promise<Response> {
    return fetch(`${url}/api/v1/auth/otp/request`, {
      body: JSON.stringify({ phone: value }),
      headers: headers(randomUUID()),
      method: "POST",
    });
  }

  async function verify(value: string, code = otp): Promise<Response> {
    return fetch(`${url}/api/v1/auth/otp/verify`, {
      body: JSON.stringify({ phone: value, code }),
      headers: headers(randomUUID()),
      method: "POST",
    });
  }

  async function insertChallenge(
    value: string,
    sentAt: Date,
    attempts = 0,
    consumedAt: Date | null = null,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO otp_challenges (id, phone_e164, code_hash, expires_at, sent_at, attempts, consumed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        value,
        "test-code-hash",
        new Date(sentAt.getTime() + 5 * 60 * 1_000),
        sentAt,
        attempts,
        consumedAt,
      ],
    );
  }

  function useClock(value: string): Date {
    const now = new Date(value);
    jest.spyOn(clock, "now").mockReturnValue(now);
    return now;
  }

  it("проверяет OTP-аутентификацию, ротацию refresh-сессии и logout", async () => {
    const value = phone();
    const requested = await requestOtp(value);
    expect(requested.status).toBe(202);
    const requestBody = (await requested.json()) as Record<string, unknown>;
    expect(requestBody).toEqual({
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    });
    expect(JSON.stringify(requestBody)).not.toContain(otp);

    const verified = await verify(value);
    expect(verified.status).toBe(200);
    const first = (await verified.json()) as { accessToken: string };
    const firstCookie = cookie(verified);
    expect(verified.headers.get("set-cookie")).toContain("HttpOnly");
    expect(verified.headers.get("set-cookie")).toContain("Path=/api/v1/auth");
    expect(verified.headers.get("set-cookie")).toContain("SameSite=Strict");
    expect(verified.headers.get("set-cookie")).not.toContain("Secure");
    const me = await fetch(`${url}/api/v1/me`, {
      headers: { authorization: `Bearer ${first.accessToken}` },
    });
    await expect(me.json()).resolves.toMatchObject({
      phoneE164: value,
      role: "customer",
    });

    const refreshed = await fetch(`${url}/api/v1/auth/refresh`, {
      headers: { cookie: firstCookie, origin: "http://localhost:5173" },
      method: "POST",
    });
    expect(refreshed.status).toBe(200);
    const nextCookie = cookie(refreshed);
    expect(nextCookie).not.toBe(firstCookie);
    expect(
      (
        await fetch(`${url}/api/v1/auth/refresh`, {
          headers: { cookie: firstCookie, origin: "http://localhost:5173" },
          method: "POST",
        })
      ).status,
    ).toBe(401);
    const logout = await fetch(`${url}/api/v1/auth/logout`, {
      headers: { cookie: nextCookie, origin: "http://localhost:5173" },
      method: "POST",
    });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect(logout.headers.get("set-cookie")).toContain("HttpOnly");
    expect(logout.headers.get("set-cookie")).toContain("Path=/api/v1/auth");
    expect(logout.headers.get("set-cookie")).toContain("SameSite=Strict");
    expect(logout.headers.get("set-cookie")).not.toContain("Secure");
    await pool.query(
      `UPDATE otp_challenges SET sent_at = NOW() - INTERVAL '61 seconds' WHERE phone_e164 = $1`,
      [value],
    );
    expect((await requestOtp(value)).status).toBe(202);
    expect((await verify(value)).status).toBe(200);
    expect(
      (
        await pool.query(
          "SELECT COUNT(*)::int AS count FROM users WHERE phone_e164 = $1",
          [value],
        )
      ).rows[0]?.count,
    ).toBe(1);
  });

  it("AUTH-05 — отклоняет истёкший одноразовый код", async () => {
    const staff = phone();
    await pool.query(
      `INSERT INTO users (phone_e164, role) VALUES ($1, 'barista')`,
      [staff],
    );
    await requestOtp(staff);
    const staffLogin = await verify(staff);
    const staffAccess = ((await staffLogin.json()) as { accessToken: string })
      .accessToken;
    await expect(
      (
        await fetch(`${url}/api/v1/me`, {
          headers: { authorization: `Bearer ${staffAccess}` },
        })
      ).json(),
    ).resolves.toMatchObject({ role: "barista" });

    const invalid = await fetch(`${url}/api/v1/auth/otp/request`, {
      body: JSON.stringify({ phone: 1 }),
      headers: headers("invalid-id"),
      method: "POST",
    });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      details: null,
      requestId: "invalid-id",
    });
    const wrong = phone();
    await requestOtp(wrong);
    const wrongCode = await verify(wrong, "000000");
    expect(wrongCode.status).toBe(401);
    await expect(wrongCode.json()).resolves.toMatchObject({
      code: "AUTH_CODE_INVALID",
      details: null,
      requestId: expect.any(String),
    });
    const cooled = phone();
    await requestOtp(cooled);
    const rate = await requestOtp(cooled);
    expect(rate.status).toBe(429);
    expect(rate.headers.get("retry-after")).toBe("60");
    await expect(rate.json()).resolves.toMatchObject({
      code: "AUTH_RATE_LIMITED",
      requestId: expect.any(String),
    });
    const expired = phone();
    await requestOtp(expired);
    await pool.query(
      `UPDATE otp_challenges SET sent_at = NOW() - INTERVAL '2 seconds', expires_at = NOW() - INTERVAL '1 second' WHERE phone_e164 = $1`,
      [expired],
    );
    const expiredCode = await verify(expired);
    expect(expiredCode.status).toBe(401);
    await expect(expiredCode.json()).resolves.toMatchObject({
      code: "AUTH_CODE_EXPIRED",
      details: null,
      requestId: expect.any(String),
    });
    const forbidden = await fetch(`${url}/api/v1/auth/refresh`, {
      headers: { origin: "https://evil.example" },
      method: "POST",
    });
    expect(forbidden.status).toBe(403);
    await expect(forbidden.json()).resolves.toMatchObject({
      code: "ACCESS_DENIED",
      details: null,
      requestId: expect.any(String),
    });
  });

  it("не создаёт новый OTP через 59 999 миллисекунд после открытого challenge", async () => {
    const now = useClock("2031-02-03T10:00:00.000Z");
    const value = phone();
    await insertChallenge(value, new Date(now.getTime() - 59_999));

    expect((await requestOtp(value)).status).toBe(429);
  });

  it("создаёт новый OTP ровно через 60 секунд после открытого challenge", async () => {
    const now = useClock("2031-02-03T10:00:00.000Z");
    const value = phone();
    await insertChallenge(value, new Date(now.getTime() - 60_000));

    expect((await requestOtp(value)).status).toBe(202);
  });

  it("создаёт новый OTP после использованного challenge до cooldown", async () => {
    const now = useClock("2031-02-03T10:00:00.000Z");
    const value = phone();
    const sentAt = new Date(now.getTime() - 1);
    await insertChallenge(value, sentAt, 0, sentAt);

    expect((await requestOtp(value)).status).toBe(202);
  });

  it("создаёт новый OTP после пятой попытки до cooldown", async () => {
    const now = useClock("2031-02-03T10:00:00.000Z");
    const value = phone();
    await insertChallenge(value, new Date(now.getTime() - 1), 5);

    expect((await requestOtp(value)).status).toBe(202);
  });

  it("при параллельных запросах создаёт один OTP и ограничивает второй", async () => {
    useClock("2031-02-03T10:00:00.000Z");
    const value = phone();

    const responses = await Promise.all([requestOtp(value), requestOtp(value)]);

    expect(responses.map((response) => response.status).sort()).toEqual([202, 429]);
  });
});
