import { GetAdminCatalogUseCase } from "./get-admin-catalog.use-case";
import type { AdminCatalogRepository } from "./admin-catalog.repository.types";

describe("GetAdminCatalogUseCase", () => {
  it("returns the v3 catalog projection", async () => {
    const v3 = {
      categories: [],
      products: [],
      priceChoices: [],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
    };
    const repository: AdminCatalogRepository = {
      findCandidates: jest.fn(),
      findV3Candidates: jest.fn().mockResolvedValue(v3),
    };
    await expect(
      new GetAdminCatalogUseCase(repository).executeV3(),
    ).resolves.toBe(v3);
    expect(repository.findV3Candidates).toHaveBeenCalledTimes(1);
  });
});
