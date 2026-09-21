import { catalogSeed } from "../../scripts/seed.constants";

describe("catalog seed v3 contract", () => {
  it("contains canonical products", () => {
    expect(catalogSeed.products).not.toHaveLength(0);
  });
});
