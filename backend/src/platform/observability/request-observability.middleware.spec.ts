import { EventEmitter } from "node:events";
import { RequestObservabilityMiddleware } from "./request-observability.middleware";

describe("RequestObservabilityMiddleware", () => {
  it("передаёт в HTTP-метрику шаблон маршрута вместо raw URL", () => {
    const logger = { log: jest.fn() };
    const metrics = { recordHttpResponse: jest.fn() };
    const middleware = new RequestObservabilityMiddleware(
      logger as never,
      metrics as never,
    );
    const response = Object.assign(new EventEmitter(), {
      setHeader: jest.fn(),
      statusCode: 200,
    });

    middleware.use(
      {
        baseUrl: "/api/v2/orders",
        headers: {},
        method: "GET",
        route: { path: "/:orderId" },
        url: "/api/v2/orders/6f7ef502-6ee5-4b27-84db-a118d9c710de?token=secret",
      } as never,
      response as never,
      jest.fn(),
    );
    response.emit("finish");

    expect(metrics.recordHttpResponse).toHaveBeenCalledWith(
      200,
      "/api/v2/orders/:orderId",
    );
    expect(metrics.recordHttpResponse).not.toHaveBeenCalledWith(
      200,
      expect.stringContaining("6f7ef502-6ee5-4b27-84db-a118d9c710de"),
    );
  });
});
