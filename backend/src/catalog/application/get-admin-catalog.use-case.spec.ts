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
    };

    await expect(
      new GetAdminCatalogUseCase(repository).execute(),
    ).resolves.toBe(catalog);
    expect(repository.findCandidates).toHaveBeenCalledTimes(1);
  });
});
