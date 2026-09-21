import { BackofficeOrdersController } from "./backoffice-orders.controller";
import { TransitionOrderUseCase } from "../application/transition-order.use-case";

const orderId = "6f7ef502-6ee5-4b27-84db-a118d9c710de";
const auth = {
  userId: "ccca6117-9fa5-4d9a-986d-8d02747cc6d5",
  sessionId: "session",
  phoneE164: "+79991234567",
  role: "barista" as const,
};

describe("BackofficeOrdersController", () => {
  it("passes issue transition with clock time", async () => {
    const now = new Date("2030-01-02T03:04:05.000Z");
    const transition = {
      execute: jest.fn().mockResolvedValue({
        id: orderId,
        number: "20300102-001",
        createdAt: now,
        total: 270,
        stage: "ISSUED",
        customer: { id: "customer", phoneE164: "+79990000000" },
        snapshot: [],
        events: [],
      }),
    };
    const controller = new BackofficeOrdersController(
      transition as unknown as TransitionOrderUseCase,
      { now: () => now },
    );
    await expect(controller.issue(orderId, auth)).resolves.toMatchObject({
      stage: "ISSUED",
    });
    expect(transition.execute).toHaveBeenCalledWith({
      orderId,
      action: "issue",
      actorId: auth.userId,
      occurredAt: now,
    });
  });
});
