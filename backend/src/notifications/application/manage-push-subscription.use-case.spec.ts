import { ManagePushSubscriptionUseCase } from "./manage-push-subscription.use-case";
import type { PushSubscriptionRepository } from "./push-notifications.types";

describe("ManagePushSubscriptionUseCase", () => {
  it("inspects an absent current association", async () => {
    const repository = {
      findByEndpoint: jest.fn().mockResolvedValue(null),
    } as unknown as PushSubscriptionRepository;
    await expect(
      new ManagePushSubscriptionUseCase(repository).inspect("user", {
        userId: "user",
        endpoint: "https://push.example",
        p256dh: "key",
        auth: "auth",
      }),
    ).resolves.toEqual({ association: "none", version: null });
  });
});
