import {
  assertV3ProductDetails,
  ProductAdminError,
} from "./product-admin.policy";
import type { V3ProductDetails } from "./product-admin.policy.types";

const product: V3ProductDetails = {
  categoryId: "category",
  name: "Капучино",
  description: "",
  price: 320,
  portionLabel: "250 мл",
  priceChoices: [],
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
};

describe("product admin policy", () => {
  it("accepts one direct v3 price", () =>
    expect(() => assertV3ProductDetails(product)).not.toThrow());
  it("requires at least two distinct choices without a direct price", () => {
    expect(() =>
      assertV3ProductDetails({
        ...product,
        price: null,
        portionLabel: null,
        priceChoices: [
          {
            portionLabel: "250 мл",
            price: 320,
            sortOrder: 0,
            isAvailable: true,
          },
        ],
      }),
    ).toThrow(ProductAdminError);
    expect(() =>
      assertV3ProductDetails({
        ...product,
        price: null,
        portionLabel: null,
        priceChoices: [
          {
            portionLabel: "250 мл",
            price: 320,
            sortOrder: 0,
            isAvailable: true,
          },
          {
            portionLabel: "350 мл",
            price: 370,
            sortOrder: 1,
            isAvailable: true,
          },
        ],
      }),
    ).not.toThrow();
  });
});
