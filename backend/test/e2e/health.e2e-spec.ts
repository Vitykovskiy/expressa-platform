import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { AppModule } from "../../src/app.module";
import { DatabaseService } from "../../src/platform/database/database.service";
import { configureHttp } from "../../src/platform/http/http-configuration";
import { configureObservability } from "../../src/platform/observability/observability-configuration";
import { ObservabilityMetrics } from "../../src/platform/observability/observability-metrics.service";

const databaseUrl = process.env.DATABASE_URL;

describe("health endpoints", () => {
  let app: INestApplication;
  let url: string;
  let isClosed = false;

  beforeAll(async () => {
    if (databaseUrl === undefined) {
      throw new Error("DATABASE_URL is required for e2e tests");
    }

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configureHttp(app, "production");
    configureObservability(app);
    await app.listen(0, "127.0.0.1");

    const address = app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (!isClosed) {
      await app.close();
    }
  });

  it("публикует liveness с requestId", async () => {
    const response = await fetch(`${url}/health/live`, {
      headers: { "x-request-id": "health-live-e2e" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("health-live-e2e");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("публикует readiness после проверки PostgreSQL", async () => {
    const response = await fetch(`${url}/health/ready`);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("возвращает безопасную unified error с requestId", async () => {
    const response = await fetch(`${url}/missing`, {
      headers: { "x-request-id": "missing-route-e2e" },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBe("missing-route-e2e");
    await expect(response.json()).resolves.toEqual({
      code: "NOT_FOUND",
      message: "Not found",
      details: null,
      requestId: "missing-route-e2e",
    });
  });

  it("не пишет query string в JSON-журнал", async () => {
    const write = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    try {
      const response = await fetch(
        `${url}/health/live?accessToken=do-not-log-secret`,
      );

      expect(response.status).toBe(200);
      expect(
        write.mock.calls.map(([message]) => String(message)).join(""),
      ).toContain('"path":"/health/live"');
      expect(
        write.mock.calls.map(([message]) => String(message)).join(""),
      ).not.toContain("do-not-log-secret");
    } finally {
      write.mockRestore();
    }
  });

  it("собирает foundation-метрики HTTP и API-ошибок", () => {
    expect(app.get(ObservabilityMetrics).snapshot()).toMatchObject({
      apiErrorsTotal: 1,
      httpRequestsTotal: 4,
      readinessFailuresTotal: 0,
      responsesByStatusClass: { "2xx": 3, "4xx": 1 },
    });
  });

  it("закрывает HTTP-сервер и пул PostgreSQL", async () => {
    const pool = app.get(DatabaseService).connectionPool;

    await app.close();
    isClosed = true;

    await expect(fetch(`${url}/health/live`)).rejects.toThrow();
    await expect(pool.query("SELECT 1")).rejects.toThrow(
      "Cannot use a pool after calling end on the pool",
    );
  });
});
