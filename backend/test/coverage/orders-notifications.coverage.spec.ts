import { SendOrderPushUseCase } from "../../src/notifications/application/send-order-push.use-case";

describe("orders notifications current contract", () => {
  it("keeps the current notification boundary", () => {
    expect(SendOrderPushUseCase).toBeDefined();
  });
});
