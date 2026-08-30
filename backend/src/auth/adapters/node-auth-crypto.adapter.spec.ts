import { createHash } from "node:crypto";
import { NodeAuthCryptoAdapter } from "./node-auth-crypto.adapter";
import { SystemClockAdapter } from "./system-clock.adapter";

const crypto = new NodeAuthCryptoAdapter({
  jwtSecret: "jwt-secret",
  otpPepper: "otp-pepper",
});
const issuedAt = new Date("2026-08-04T10:00:00.000Z");
const issuedAtSeconds = Math.floor(issuedAt.getTime() / 1000);
const accessTokenInput = {
  audience: "expressa-api",
  issuer: "expressa",
  now: issuedAt,
  sessionId: "session-id",
  subject: "user-id",
  ttlMs: 15 * 60 * 1000,
};

describe("NodeAuthCryptoAdapter", () => {
  it("создаёт и проверяет HS256 access token с обязательными claims", () => {
    const token = crypto.createAccessToken(accessTokenInput);

    expect(crypto.verifyAccessToken(token, accessTokenInput)).toEqual({
      aud: "expressa-api",
      exp: issuedAtSeconds + 15 * 60,
      iat: issuedAtSeconds,
      iss: "expressa",
      sid: "session-id",
      sub: "user-id",
    });
    expect(
      crypto.verifyAccessToken(token, {
        ...accessTokenInput,
        audience: "other-api",
      }),
    ).toBeNull();
  });

  it("отклоняет token с неверной signature, expiry или внешней формой", () => {
    const token = crypto.createAccessToken(accessTokenInput);
    const futureToken = crypto.createAccessToken({
      ...accessTokenInput,
      now: new Date("2026-08-04T10:01:00.000Z"),
    });
    const [header, payload] = token.split(".");

    expect(
      crypto.verifyAccessToken(
        `${header}.${payload}.invalid`,
        accessTokenInput,
      ),
    ).toBeNull();
    expect(
      crypto.verifyAccessToken(token, {
        ...accessTokenInput,
        now: new Date("2026-08-04T10:15:00.000Z"),
      }),
    ).toBeNull();
    expect(crypto.verifyAccessToken(futureToken, accessTokenInput)).toBeNull();
    expect(crypto.verifyAccessToken("not-a-jwt", accessTokenInput)).toBeNull();
  });

  it("создаёт HMAC OTP hash и сравнивает его без раскрытия кода", () => {
    const hash = crypto.createOtpHash("challenge-id", "+79990000000", "123456");

    expect(
      crypto.verifyOtpHash("challenge-id", "+79990000000", "123456", hash),
    ).toBe(true);
    expect(
      crypto.verifyOtpHash("challenge-id", "+79990000000", "654321", hash),
    ).toBe(false);
    expect(
      crypto.verifyOtpHash("challenge-id", "+79990000000", "123456", "invalid"),
    ).toBe(false);
  });

  it("создаёт UUID session ID и 32-byte refresh secret", () => {
    const firstSessionId = crypto.generateSessionId();
    const secondSessionId = crypto.generateSessionId();
    const secret = crypto.generateRefreshSecret();

    expect(firstSessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(secondSessionId).not.toBe(firstSessionId);
    expect(Buffer.from(secret, "base64url")).toHaveLength(32);
  });

  it("хеширует полный canonical refresh token", () => {
    const sessionId = "39b0ae84-71dd-4338-b5b3-d7a5a6495728";
    const otherSessionId = "40d5c59e-3114-4d79-ab9f-20d541159f1f";
    const secret = "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE";
    const token = `${sessionId}.${secret}`;

    expect(crypto.hashRefreshToken(token)).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(crypto.hashRefreshToken(token)).not.toBe(
      crypto.hashRefreshToken(`${otherSessionId}.${secret}`),
    );
    expect(crypto.hashRefreshToken(secret)).toBeNull();
    expect(crypto.hashRefreshToken("invalid")).toBeNull();
  });

  it("системные часы отдают текущее время через Clock port", () => {
    const clock = new SystemClockAdapter();
    const before = Date.now();
    const now = clock.now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
