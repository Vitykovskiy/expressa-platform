import { catalogSeed } from "../../scripts/seed.constants";

describe("order unit of work v3 fixture", () => {
  it("uses the canonical catalog seed", () => {
    expect(catalogSeed.products[0]).toBeDefined();
  });
});
