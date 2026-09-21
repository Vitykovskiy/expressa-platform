import { GetPublicMenuUseCase } from "./get-public-menu.use-case";
import type { PublicMenuRepository } from "./public-menu.repository.types";

describe("GetPublicMenuUseCase", () => {
  it("publishes a v3 product with direct price", async () => {
    const candidates = {
      acceptsNewOrders: true,
      categories: [
        {
          id: "category",
          name: "Кофе",
          description: "",
          sortOrder: 0,
          isActive: true,
          archivedAt: null,
        },
      ],
      products: [
        {
          id: "product",
          categoryId: "category",
          name: "Раф",
          description: "",
          portionLabel: "250 мл",
          price: 270,
          sortOrder: 0,
          isActive: true,
          isAvailable: true,
          archivedAt: null,
        },
      ],
      priceChoices: [],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
      productModifierGroups: [],
    };
    const repository: PublicMenuRepository = {
      findV3Candidates: jest.fn().mockResolvedValue(candidates),
    };
    await expect(
      new GetPublicMenuUseCase(repository).executeV3(),
    ).resolves.toMatchObject({
      acceptsNewOrders: true,
      categories: [
        {
          id: "category",
          products: [{ id: "product", price: 270, portionLabel: "250 мл" }],
        },
      ],
    });
  });
});
