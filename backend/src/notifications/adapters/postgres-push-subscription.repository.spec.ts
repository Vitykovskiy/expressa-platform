import { PostgresPushSubscriptionRepository } from "./postgres-push-subscription.repository";

describe("PostgresPushSubscriptionRepository", () => {
  it("не передаёт endpoint другому пользователю при конфликте", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const repository = new PostgresPushSubscriptionRepository({
      pool: { query } as never,
    });

    await repository.upsert({
      userId: "other-user",
      endpoint: "https://push.example/subscription",
      p256dh: "key",
      auth: "auth",
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        "WHERE push_subscriptions.user_id = EXCLUDED.user_id",
      ),
      ["other-user", "https://push.example/subscription", "key", "auth"],
    );
    expect(query.mock.calls[0][0]).not.toContain("user_id = EXCLUDED.user_id,");
  });
});
