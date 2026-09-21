import { assertV3ProductDetails } from "../../src/catalog/domain/product-admin.policy";

describe("catalog v3 coverage", () => {
  it("accepts canonical multi-price details", () => {
    expect(() => assertV3ProductDetails({ categoryId: "coffee", name: "Капучино", description: "", price: null, portionLabel: null, priceChoices: [{ portionLabel: "250 мл", price: 320, sortOrder: 0, isAvailable: true }, { portionLabel: "350 мл", price: 370, sortOrder: 1, isAvailable: true }], sortOrder: 0, isActive: true, isAvailable: true })).not.toThrow();
  });
});
