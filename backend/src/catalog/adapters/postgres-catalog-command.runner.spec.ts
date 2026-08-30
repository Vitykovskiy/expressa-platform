import type { Pool, PoolClient } from "pg";
import {
  catalogAdvisoryLockKey,
  catalogCommandAdvisoryLockSql,
} from "./catalog-advisory-lock.constants";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";

function createRunner(): {
  client: jest.Mocked<PoolClient>;
  runner: PostgresCatalogCommandRunner;
} {
  const client = {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn(),
  } as unknown as jest.Mocked<PoolClient>;
  const pool = {
    connect: jest.fn().mockResolvedValue(client),
  } as unknown as Pool;

  return { client, runner: new PostgresCatalogCommandRunner(pool) };
}

describe("PostgresCatalogCommandRunner", () => {
  it("блокирует каталог, выполняет команду и аудит в одной транзакции", async () => {
    const { client, runner } = createRunner();
    const command = jest.fn().mockResolvedValue("category-id");
    const audit = jest.fn().mockResolvedValue(undefined);

    await expect(runner.run(command, audit)).resolves.toBe("category-id");

    expect(command).toHaveBeenCalledWith(client);
    expect(audit).toHaveBeenCalledWith(client, "category-id");
    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      catalogCommandAdvisoryLockSql,
      [catalogAdvisoryLockKey],
    );
    expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("откатывает транзакцию и освобождает клиент, если аудит завершается ошибкой", async () => {
    const { client, runner } = createRunner();
    const error = new Error("audit failed");
    const command = jest.fn().mockResolvedValue("category-id");
    const audit = jest.fn().mockRejectedValue(error);

    await expect(runner.run(command, audit)).rejects.toThrow(error);

    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      catalogCommandAdvisoryLockSql,
      [catalogAdvisoryLockKey],
    );
    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
