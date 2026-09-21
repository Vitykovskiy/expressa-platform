import { ManageV3ProductsUseCase } from "./manage-products.use-case";
import type {
  V3ProductsRepository,
  V3ProductsUnitOfWork,
} from "./products.repository.types";

const command = {
  categoryId: "category",
  name: "Раф",
  description: "",
  price: 270,
  portionLabel: "250 мл",
  priceChoices: [],
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  actorId: "staff",
  requestId: "request",
};

describe("ManageV3ProductsUseCase", () => {
  it("creates a v3 direct-price product and writes audit", async () => {
    const result = { id: "product", ...command, archivedAt: null };
    const repository: V3ProductsRepository = {
      categoryExists: jest.fn().mockResolvedValue(true),
      findV3ById: jest.fn(),
      findCurrentV3ByCategory: jest.fn(),
      createV3: jest.fn().mockResolvedValue(result),
      updateV3: jest.fn(),
      reorderV3: jest.fn(),
      archiveV3: jest.fn(),
      writeV3Audit: jest.fn(),
    };
    const unitOfWork: V3ProductsUnitOfWork = {
      runV3: async (run, audit) => {
        const value = await run(repository);
        await audit(repository, value);
        return value;
      },
    };
    await expect(
      new ManageV3ProductsUseCase(unitOfWork).create(command),
    ).resolves.toBe(result);
    expect(repository.createV3).toHaveBeenCalledWith(command);
    expect(repository.writeV3Audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_CREATED",
        productId: "product",
      }),
    );
  });
});
