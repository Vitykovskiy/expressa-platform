import { GetAdminCatalogUseCase } from "./get-admin-catalog.use-case";
import type {
  AdminCatalogCandidates,
  AdminCatalogRepository,
} from "./admin-catalog.repository.types";

describe("GetAdminCatalogUseCase", () => {
  it("возвращает полный неархивированный каталог без фильтрации активности", async () => {
    const catalog: AdminCatalogCandidates = {
      categories: [],
      products: [],
      productVariants: [],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
    };
    const repository: AdminCatalogRepository = {
      findCandidates: jest.fn().mockResolvedValue(catalog),
      findV3Candidates: jest.fn(),
    };

    await expect(
      new GetAdminCatalogUseCase(repository).execute(),
    ).resolves.toBe(catalog);
    expect(repository.findCandidates).toHaveBeenCalledTimes(1);
  });
  it("returns the typed v3 catalog projection without legacy variants", async () => {
    const catalog = {
      categories: [],
      products: [],
      priceChoices: [],
      modifierGroups: [],
      modifierOptions: [],
      categoryModifierGroups: [],
    };
    const repository: AdminCatalogRepository = {
      findCandidates: jest.fn(),
      findV3Candidates: jest.fn().mockResolvedValue(catalog),
    };
    await expect(
      new GetAdminCatalogUseCase(repository).executeV3(),
    ).resolves.toBe(catalog);
    expect(repository.findV3Candidates).toHaveBeenCalledTimes(1);
  });
});
