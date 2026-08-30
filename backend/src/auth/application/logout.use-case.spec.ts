import type { AuthCrypto } from "./auth-crypto.types";
import type {
  AuthRepository,
  AuthSession,
  SessionLogout,
} from "./auth-repository.types";
import type { Clock } from "./clock.types";
import { AccessDeniedError } from "../domain/auth.errors";
import { LogoutUseCase } from "./logout.use-case";

const now = new Date("2026-08-04T10:00:00.000Z");
const sessionId = "d2719b1e-6b2c-4c4e-8e61-5c5cc62e1952";
const refreshSecret = "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE";
const foreignRefreshSecret = "YmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmI";
const revokedSession: AuthSession = {
  createdAt: new Date("2026-08-04T09:00:00.000Z"),
  expiresAt: new Date("2026-08-11T09:00:00.000Z"),
  id: sessionId,
  refreshTokenHash: "secret-hash",
  revokedAt: now,
  rotatedAt: null,
  userId: "user-id",
};

function createUseCase(logoutResult: SessionLogout) {
  const repository = {
    logoutSession: jest.fn().mockResolvedValue(logoutResult),
  } as unknown as jest.Mocked<AuthRepository>;
  const crypto = {
    hashRefreshToken: jest.fn((token: string) => `${token}-hash`),
  } as unknown as jest.Mocked<AuthCrypto>;
  const clock = { now: jest.fn().mockReturnValue(now) } as jest.Mocked<Clock>;

  return { repository, useCase: new LogoutUseCase(repository, crypto, clock) };
}

describe("LogoutUseCase", () => {
  it("отзывает известную сессию по refresh token", async () => {
    const { useCase, repository } = createUseCase({
      session: revokedSession,
      status: "revoked",
    });

    await expect(
      useCase.execute(`${sessionId}.${refreshSecret}`),
    ).resolves.toBeUndefined();
    expect(repository.logoutSession).toHaveBeenCalledWith(
      sessionId,
      `${sessionId}.${refreshSecret}-hash`,
      now,
    );
  });

  it("повторный logout остаётся идемпотентным", async () => {
    const { useCase, repository } = createUseCase({ status: "unavailable" });

    await expect(
      useCase.execute(`${sessionId}.${refreshSecret}`),
    ).resolves.toBeUndefined();
    await expect(
      useCase.execute(`${sessionId}.${refreshSecret}`),
    ).resolves.toBeUndefined();
    expect(repository.logoutSession).toHaveBeenCalledTimes(2);
  });

  it("не отзывает чужую сессию при валидном секрете другого refresh token", async () => {
    const { useCase, repository } = createUseCase({ status: "unavailable" });

    await expect(
      useCase.execute(`${sessionId}.${foreignRefreshSecret}`),
    ).resolves.toBeUndefined();
    expect(repository.logoutSession).toHaveBeenCalledWith(
      sessionId,
      `${sessionId}.${foreignRefreshSecret}-hash`,
      now,
    );
  });

  it("отклоняет refresh token вне контракта без обращения к repository", async () => {
    const { useCase, repository } = createUseCase({ status: "unavailable" });

    await expect(useCase.execute("invalid")).rejects.toThrow(AccessDeniedError);
    expect(repository.logoutSession).not.toHaveBeenCalled();
  });
});
