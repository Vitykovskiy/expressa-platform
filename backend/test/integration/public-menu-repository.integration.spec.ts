import { catalogSeed } from "../../scripts/seed.constants";

describe("public menu repository v3 fixture", () => {
  it("uses canonical price choices", () => {
    expect(catalogSeed.productPriceChoices).not.toHaveLength(0);
  });
});
