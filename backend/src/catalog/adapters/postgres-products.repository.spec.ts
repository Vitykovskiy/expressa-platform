import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import { PostgresProductsRepository } from "./postgres-products.repository";

describe("PostgresProductsRepository", () => {
  it("delegates v3 commands to the catalog command runner", async () => {
    const runner = {
      run: jest.fn().mockResolvedValue("result"),
    } as unknown as PostgresCatalogCommandRunner;
    const repository = new PostgresProductsRepository(runner);
    await expect(
      repository.runV3(
        async () => "command",
        async () => undefined,
      ),
    ).resolves.toBe("result");
    expect(runner.run).toHaveBeenCalledTimes(1);
  });
});
