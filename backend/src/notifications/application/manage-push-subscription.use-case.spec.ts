import { ManagePushSubscriptionUseCase } from "./manage-push-subscription.use-case";
import type { PushSubscriptionRepository } from "./push-notifications.types";

describe("ManagePushSubscriptionUseCase", () => {
  it("сохраняет и удаляет подписку только через порт хранилища", async () => {
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
      findForUser: jest.fn(),
      findForStaff: jest.fn(),
    };
    const useCase = new ManagePushSubscriptionUseCase(repository);
    const command = {
      userId: "user-id",
      endpoint: "https://push.example/subscription",
      p256dh: "key",
      auth: "auth",
    };

    await useCase.upsert(command);
    await useCase.delete(command.userId, command.endpoint);

    expect(repository.upsert).toHaveBeenCalledWith(command);
    expect(repository.delete).toHaveBeenCalledWith(
      command.userId,
      command.endpoint,
    );
  });
});
