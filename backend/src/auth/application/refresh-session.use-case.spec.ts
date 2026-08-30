import type { AuthCrypto } from "./auth-crypto.types";
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
} from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import { RefreshSessionUseCase } from "./refresh-session.use-case";

const now = new Date("2026-08-04T10:00:00.000Z");
const sessionId = "d2719b1e-6b2c-4c4e-8e61-5c5cc62e1952";
const user: AuthUser = {
  id: "user-id",
  phoneE164: "+79123456789",
  role: "customer",
};
const session: AuthSession = {
  createdAt: new Date("2026-08-04T09:00:00.000Z"),
  expiresAt: new Date("2026-08-11T09:00:00.000Z"),
  id: sessionId,
  refreshTokenHash: "next-hash",
  revokedAt: null,
  rotatedAt: now,
  userId: user.id,
};

function createUseCase(
  result: Awaited<ReturnType<AuthRepository["rotateSession"]>>,
) {
  const repository = {
    rotateSession: jest.fn().mockResolvedValue(result),
  } as unknown as jest.Mocked<AuthRepository>;
  const crypto = {
    createAccessToken: jest.fn().mockReturnValue("access-token"),
    generateRefreshSecret: jest.fn().mockReturnValue("next-secret"),
    hashRefreshToken: jest.fn((token: string) => `${token}-hash`),
  } as unknown as jest.Mocked<AuthCrypto>;
  const clock = { now: jest.fn().mockReturnValue(now) } as jest.Mocked<Clock>;

  return {
    crypto,
    repository,
    useCase: new RefreshSessionUseCase(repository, crypto, clock, {
      accessTokenAudience: "expressa-api",
      accessTokenIssuer: "expressa",
      accessTokenTtlMs: 15 * 60 * 1000,
    }),
  };
}

describe("RefreshSessionUseCase", () => {
  it("атомарно ротирует refresh token и не продлевает expiry сессии", async () => {
    const { useCase, repository, crypto } = createUseCase({
      session,
      status: "rotated",
      user,
    });

    await expect(
      useCase.execute(`${sessionId}.current-secret`),
    ).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: `${sessionId}.next-secret`,
      sessionExpiresAt: new Date("2026-08-11T09:00:00.000Z"),
      user,
    });

    expect(repository.rotateSession).toHaveBeenCalledWith(
      sessionId,
      `${sessionId}.current-secret-hash`,
      `${sessionId}.next-secret-hash`,
      now,
    );
    expect(crypto.createAccessToken).toHaveBeenCalledWith({
      audience: "expressa-api",
      issuer: "expressa",
      now,
      sessionId,
      subject: user.id,
      ttlMs: 15 * 60 * 1000,
    });
    expect(session.expiresAt).toEqual(new Date("2026-08-11T09:00:00.000Z"));
  });

  it.each([
    "",
    "invalid",
    `${sessionId}.`,
    `not-a-uuid.current-secret`,
    `${sessionId}.a.b`,
  ])("отклоняет refresh token вне контракта %s", async (token) => {
    const { useCase, repository } = createUseCase({ status: "unavailable" });

    await expect(useCase.execute(token)).rejects.toThrow(AccessDeniedError);
    expect(repository.rotateSession).not.toHaveBeenCalled();
  });

  it("не выдаёт токены после replay: repository отзывает mismatch", async () => {
    const { useCase, crypto } = createUseCase({
      session: { ...session, revokedAt: now },
      status: "mismatch",
      user,
    });

    await expect(
      useCase.execute(`${sessionId}.replayed-secret`),
    ).rejects.toThrow(AccessDeniedError);
    expect(crypto.createAccessToken).not.toHaveBeenCalled();
  });

  it("не выдаёт токены для отозванной или истёкшей сессии", async () => {
    const { useCase, crypto } = createUseCase({ status: "unavailable" });

    await expect(
      useCase.execute(`${sessionId}.current-secret`),
    ).rejects.toThrow(AccessDeniedError);
    expect(crypto.createAccessToken).not.toHaveBeenCalled();
  });
});
