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
});
