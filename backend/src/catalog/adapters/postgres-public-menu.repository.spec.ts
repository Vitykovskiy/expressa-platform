import type { Pool } from "pg";
import { PostgresPublicMenuRepository } from "./postgres-public-menu.repository";

describe("PostgresPublicMenuRepository", () => {
  it("reads v3 price choices", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    query.mockResolvedValueOnce({ rows: [{ value: true }] });
    const repository = new PostgresPublicMenuRepository({
      query,
    } as unknown as Pool);
    await expect(repository.findV3Candidates()).resolves.toMatchObject({
      acceptsNewOrders: true,
      priceChoices: [],
    });
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes("product_price_choices"),
      ),
    ).toBe(true);
  });
});
