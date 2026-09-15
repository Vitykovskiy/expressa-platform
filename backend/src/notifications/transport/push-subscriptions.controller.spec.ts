import { HttpException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ManagePushSubscriptionUseCase } from "../application/manage-push-subscription.use-case";
import { PushSubscriptionsController } from "./push-subscriptions.controller";
import { PATH_METADATA } from "@nestjs/common/constants";

const auth = {
  userId: "customer-id",
  sessionId: "session-id",
  phoneE164: "+79991234567",
  role: "customer" as const,
};
const subscription = {
  endpoint: "https://push.example/subscription",
  keys: { p256dh: "key", auth: "auth" },
};
const associationVersion = "00000000-0000-4000-8000-000000000001";

describe("PushSubscriptionsController", () => {
  it("использует путь без дублирования global api prefix", () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, PushSubscriptionsController),
    ).toBe("push");
  });

  it("сохраняет и удаляет подписку текущего пользователя", async () => {
    const useCase = {
      upsert: jest.fn(),
      delete: jest.fn(),
    } as unknown as ManagePushSubscriptionUseCase;
    const controller = new PushSubscriptionsController(
      useCase,
      new ConfigService({ VAPID_PUBLIC_KEY: "public-key" }),
    );

    await controller.upsert(subscription, auth);
    await controller.delete(subscription, auth);

    expect(useCase.upsert).toHaveBeenCalledWith({
      userId: auth.userId,
      endpoint: subscription.endpoint,
      p256dh: "key",
      auth: "auth",
    });
    expect(useCase.delete).toHaveBeenCalledWith(
      auth.userId,
      subscription.endpoint,
    );
    expect(controller.publicKey()).toEqual({ publicKey: "public-key" });
  });

  it("отклоняет невалидную subscription без вызова сценария", async () => {
    const useCase = {
      upsert: jest.fn(),
      delete: jest.fn(),
    } as unknown as ManagePushSubscriptionUseCase;
    const controller = new PushSubscriptionsController(
      useCase,
      new ConfigService({ VAPID_PUBLIC_KEY: "public-key" }),
    );

    await expect(
      controller.upsert(
        {
          endpoint: "http://insecure.example",
          keys: { p256dh: "", auth: "auth" },
        },
        auth,
      ),
    ).rejects.toBeInstanceOf(HttpException);
    expect(useCase.upsert).not.toHaveBeenCalled();
  });

  it("передаёт inspection, explicit transfer и owner stop только текущему customer", async () => {
    const useCase = {
      inspect: jest.fn().mockResolvedValue({
        association: "other",
        version: associationVersion,
      }),
      associate: jest.fn().mockResolvedValue({
        association: "current",
        version: associationVersion,
      }),
      deleteAssociation: jest.fn(),
    } as unknown as ManagePushSubscriptionUseCase;
    const controller = new PushSubscriptionsController(
      useCase,
      new ConfigService({ VAPID_PUBLIC_KEY: "public-key" }),
    );

    await expect(controller.inspect(subscription, auth)).resolves.toEqual({
      association: "other",
      version: associationVersion,
    });
    await expect(
      controller.associate(
        {
          subscription,
          action: "transfer",
          expectedVersion: associationVersion,
        },
        auth,
      ),
    ).resolves.toEqual({ association: "current", version: associationVersion });
    await expect(
      controller.deleteAssociation(
        { subscription, expectedVersion: associationVersion },
        auth,
      ),
    ).resolves.toBeUndefined();

    expect(useCase.inspect).toHaveBeenCalledWith(auth.userId, {
      userId: auth.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
    expect(useCase.associate).toHaveBeenCalledWith(
      auth.userId,
      expect.objectContaining({ endpoint: subscription.endpoint }),
      "transfer",
      associationVersion,
    );
    expect(useCase.deleteAssociation).toHaveBeenCalledWith(
      auth.userId,
      expect.objectContaining({ endpoint: subscription.endpoint }),
      associationVersion,
    );
  });
});
