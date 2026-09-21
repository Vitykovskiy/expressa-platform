import { PostgresPushSubscriptionRepository } from "./postgres-push-subscription.repository";

describe("PostgresPushSubscriptionRepository", () => {
  it("exports the current association repository", () => {
    expect(PostgresPushSubscriptionRepository).toBeDefined();
  });
});
