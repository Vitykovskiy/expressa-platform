import { ManagePushSubscriptionUseCase } from "./manage-push-subscription.use-case";
import type { PushSubscriptionRepository } from "./push-notifications.types";

describe("ManagePushSubscriptionUseCase", () => {
  it("сохраняет и удаляет подписку только через порт хранилища", async () => {
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
      findByEndpoint: jest.fn(),
      createAssociation: jest.fn(),
      transferAssociation: jest.fn(),
      deleteAssociation: jest.fn(),
      deleteSnapshot: jest.fn(),
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

  it("does not transfer a foreign association through legacy upsert", async () => {
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
      findByEndpoint: jest.fn(),
      createAssociation: jest.fn().mockResolvedValue(null),
      transferAssociation: jest.fn(),
      deleteAssociation: jest.fn(),
      deleteSnapshot: jest.fn(),
      findForUser: jest.fn(),
      findForStaff: jest.fn(),
    };
    const useCase = new ManagePushSubscriptionUseCase(repository);

    await expect(
      useCase.associate(
        "customer-b",
        {
          userId: "customer-b",
          endpoint: "https://push.example/subscription",
          p256dh: "key",
          auth: "auth",
        },
        "enable",
        null,
      ),
    ).rejects.toMatchObject({ code: "PUSH_ASSOCIATION_CONFLICT" });
    expect(repository.transferAssociation).not.toHaveBeenCalled();
  });
});
