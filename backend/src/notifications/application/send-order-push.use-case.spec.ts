import { SendOrderPushUseCase } from "./send-order-push.use-case";
import type {
  PushSender,
  PushSubscriptionRepository,
} from "./push-notifications.types";

const subscription = {
  id: "subscription-id",
  userId: "customer-id",
  endpoint: "https://push.example/subscription",
  p256dh: "key",
  auth: "auth",
};

describe("SendOrderPushUseCase", () => {
  it("уведомляет staff о новом заказе", async () => {
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
      findForUser: jest.fn(),
      findForStaff: jest.fn().mockResolvedValue([subscription]),
    };
    const sender: PushSender = { send: jest.fn() };

    await new SendOrderPushUseCase(repository, sender).execute({
      recipient: "staff",
      orderId: "order-id",
      number: "20300102-001",
      stage: "CREATED",
      customerId: "customer-id",
    });

    expect(repository.findForStaff).toHaveBeenCalledWith();
    expect(sender.send).toHaveBeenCalledWith(subscription, {
      title: "Новый заказ",
      body: "Заказ 20300102-001 ожидает принятия",
      orderId: "order-id",
    });
  });

  it("удаляет недействительную подписку и не выбрасывает ошибку доставки", async () => {
    const repository: PushSubscriptionRepository = {
      upsert: jest.fn(),
      delete: jest.fn(),
      findForUser: jest.fn().mockResolvedValue([subscription]),
      findForStaff: jest.fn(),
    };
    const sender: PushSender = {
      send: jest.fn().mockRejectedValue({ statusCode: 410 }),
    };

    await expect(
      new SendOrderPushUseCase(repository, sender).execute({
        recipient: "customer",
        orderId: "order-id",
        number: "20300102-001",
        stage: "READY",
        customerId: "customer-id",
      }),
    ).resolves.toBeUndefined();

    expect(repository.findForUser).toHaveBeenCalledWith("customer-id");
    expect(repository.delete).toHaveBeenCalledWith(
      "customer-id",
      subscription.endpoint,
    );
  });
});
