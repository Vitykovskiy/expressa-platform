import type { AuthCrypto } from "./auth-crypto.types";
import type {
  AuthRepository,
  StoredOtpChallenge,
} from "./auth-repository.types";
import type { Clock } from "./clock.types";
import type { OtpCodeGenerator } from "./otp-code-generator.types";
import {
  OtpDeliveryUnavailableError,
  RequestOtpUseCase,
} from "./request-otp.use-case";
import type { SmsSender } from "./sms-sender.types";
import { OtpRateLimitedError } from "../domain/auth.errors";

const now = new Date("2026-08-04T10:00:00.000Z");

function createChallenge(
  overrides: Partial<StoredOtpChallenge> = {},
): StoredOtpChallenge {
  return {
    id: "challenge-id",
    codeHash: "code-hash",
    expiresAt: new Date("2026-08-04T10:05:00.000Z"),
    consumedAt: null,
    sentAt: now,
    attempts: 0,
    ...overrides,
  };
}

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    findCurrentUser: jest.fn(),
    findOpenOtpChallenge: jest.fn(),
    findOrCreateCustomer: jest.fn(),
    findSessionByRefreshTokenHash: jest.fn(),
    findSessionWithUser: jest.fn(),
    invalidateOtpChallenge: jest.fn(),
    logoutSession: jest.fn(),
    revokeSession: jest.fn(),
    reserveOtpChallenge: jest.fn(),
    rotateSession: jest.fn(),
    verifyOtpAndCreateSession: jest.fn(),
  };
}

function createCrypto(): jest.Mocked<AuthCrypto> {
  return {
    createAccessToken: jest.fn(),
    createOtpHash: jest
      .fn<
        ReturnType<AuthCrypto["createOtpHash"]>,
        Parameters<AuthCrypto["createOtpHash"]>
      >()
      .mockReturnValue("hash"),
    generateRefreshSecret: jest.fn(),
    generateSessionId: jest.fn(),
    hashRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyOtpHash: jest.fn(),
  };
}

describe("RequestOtpUseCase", () => {
  it("нормализует номер, сохраняет hash и возвращает только интервалы", async () => {
    const repository = createRepository();
    repository.reserveOtpChallenge.mockResolvedValue({
      status: "created",
      challenge: createChallenge(),
    });
    const crypto = createCrypto();
    crypto.createOtpHash.mockImplementation(
      (challengeId) => "hash-" + challengeId,
    );
    const codeGenerator: jest.Mocked<OtpCodeGenerator> = {
      generate: jest.fn(() => "123456"),
    };
    const smsSender: jest.Mocked<SmsSender> = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    const clock: Clock = { now: () => now };
    const useCase = new RequestOtpUseCase(
      repository,
      codeGenerator,
      crypto,
      smsSender,
      clock,
    );

    await expect(useCase.execute("8 999 123-45-67")).resolves.toEqual({
      retryAfterSeconds: 60,
      expiresInSeconds: 300,
    });
    expect(crypto.createOtpHash).toHaveBeenCalledWith(
      expect.any(String),
      "+79991234567",
      "123456",
    );
    expect(repository.reserveOtpChallenge).toHaveBeenCalledWith(
      "+79991234567",
      expect.stringMatching(/^hash-/),
      new Date("2026-08-04T10:05:00.000Z"),
      now,
      expect.any(String),
    );
    expect(smsSender.send).toHaveBeenCalledWith("+79991234567", "123456");
  });

  it("не отправляет повторный код в течение cooldown", async () => {
    const repository = createRepository();
    repository.reserveOtpChallenge.mockResolvedValue({
      status: "rate_limited",
    });
    const smsSender: jest.Mocked<SmsSender> = { send: jest.fn() };
    const useCase = new RequestOtpUseCase(
      repository,
      { generate: jest.fn() },
      createCrypto(),
      smsSender,
      { now: () => new Date(now.getTime() + 59_999) },
    );

    await expect(useCase.execute("+79991234567")).rejects.toBeInstanceOf(
      OtpRateLimitedError,
    );
    expect(smsSender.send).not.toHaveBeenCalled();
  });

  it("закрывает challenge и не раскрывает ошибку SMS", async () => {
    const repository = createRepository();
    repository.reserveOtpChallenge.mockResolvedValue({
      status: "created",
      challenge: createChallenge(),
    });
    const senderError = new Error("provider secret");
    const useCase = new RequestOtpUseCase(
      repository,
      { generate: () => "123456" },
      createCrypto(),
      { send: jest.fn().mockRejectedValue(senderError) },
      { now: () => now },
    );

    await expect(useCase.execute("+79991234567")).rejects.toEqual(
      new OtpDeliveryUnavailableError(),
    );
    expect(repository.invalidateOtpChallenge).toHaveBeenCalledWith(
      expect.any(String),
      now,
    );
  });

  it("закрывает только challenge отложенно упавшей отправки", async () => {
    const repository = createRepository();
    repository.reserveOtpChallenge.mockResolvedValue({
      status: "created",
      challenge: createChallenge(),
    });
    const firstFailure = new Error("first provider failure");
    let rejectFirstDelivery: ((reason: Error) => void) | undefined;
    const smsSender: SmsSender = {
      send: jest
        .fn<Promise<void>, Parameters<SmsSender["send"]>>()
        .mockImplementationOnce(
          () =>
            new Promise<void>((_resolve, reject) => {
              rejectFirstDelivery = reject;
            }),
        )
        .mockResolvedValueOnce(undefined),
    };
    const useCase = new RequestOtpUseCase(
      repository,
      { generate: () => "123456" },
      createCrypto(),
      smsSender,
      { now: () => now },
    );

    const firstRequest = useCase.execute("+79991234567");
    await useCase.execute("+79991234567");
    const firstChallengeId = repository.reserveOtpChallenge.mock.calls[0]?.[4];
    const secondChallengeId = repository.reserveOtpChallenge.mock.calls[1]?.[4];

    if (
      rejectFirstDelivery === undefined ||
      firstChallengeId === undefined ||
      secondChallengeId === undefined
    ) {
      throw new Error("OTP requests were not created");
    }

    rejectFirstDelivery(firstFailure);
    await expect(firstRequest).rejects.toEqual(
      new OtpDeliveryUnavailableError(),
    );
    expect(repository.invalidateOtpChallenge).toHaveBeenCalledWith(
      firstChallengeId,
      now,
    );
    expect(repository.invalidateOtpChallenge).not.toHaveBeenCalledWith(
      secondChallengeId,
      now,
    );
  });

  it("отправляет SMS только для единственного созданного параллельного challenge", async () => {
    const repository = createRepository();
    repository.reserveOtpChallenge
      .mockResolvedValueOnce({
        status: "created",
        challenge: createChallenge(),
      })
      .mockResolvedValueOnce({ status: "rate_limited" });
    const smsSender: jest.Mocked<SmsSender> = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new RequestOtpUseCase(
      repository,
      { generate: jest.fn(() => "123456") },
      createCrypto(),
      smsSender,
      { now: () => now },
    );

    const [first, second] = await Promise.allSettled([
      useCase.execute("+79991234567"),
      useCase.execute("+79991234567"),
    ]);

    expect([first.status, second.status].sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(smsSender.send).toHaveBeenCalledTimes(1);
  });
});
