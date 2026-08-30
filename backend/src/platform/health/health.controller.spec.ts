import { ServiceUnavailableException } from "@nestjs/common";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  const metrics = { recordReadinessFailure: jest.fn() };

  beforeEach(() => {
    metrics.recordReadinessFailure.mockClear();
  });

  it("возвращает live без обращения к PostgreSQL", () => {
    const query = jest.fn();
    const controller = new HealthController(
      {
        connectionPool: { query },
      } as never,
      metrics as never,
    );

    expect(controller.getLiveness()).toEqual({ status: "ok" });
    expect(query).not.toHaveBeenCalled();
  });

  it("возвращает ready после успешной проверки PostgreSQL", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const controller = new HealthController(
      {
        connectionPool: { query },
      } as never,
      metrics as never,
    );

    await expect(controller.getReadiness()).resolves.toEqual({ status: "ok" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("не раскрывает ошибку PostgreSQL при недоступном readiness", async () => {
    const controller = new HealthController(
      {
        connectionPool: {
          query: jest.fn().mockRejectedValue(new Error("secret")),
        },
      } as never,
      metrics as never,
    );

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(metrics.recordReadinessFailure).toHaveBeenCalledTimes(1);
  });
});
