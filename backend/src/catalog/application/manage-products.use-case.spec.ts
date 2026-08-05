import { ManageProductsUseCase } from "./manage-products.use-case";
import type {
  ProductsRepository,
  ProductsUnitOfWork,
} from "./products.repository.types";
const product = {
  id: "product",
  categoryId: "category",
  type: "DRINK" as const,
  name: "Капучино",
  description: "",
  priceMinor: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  archivedAt: null,
  variants: [
    {
      id: "variant",
      productId: "product",
      size: "M" as const,
      priceMinor: 32000,
      sortOrder: 0,
      isAvailable: true,
      archivedAt: null,
    },
  ],
};
const command = {
  categoryId: "category",
  type: "DRINK" as const,
  name: "Капучино",
  description: "",
  priceMinor: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  variants: [
    { size: "M" as const, priceMinor: 32000, sortOrder: 0, isAvailable: true },
  ],
  actorId: "actor",
  requestId: "request",
};
function setup() {
  const repository: jest.Mocked<ProductsRepository> = {
    categoryExists: jest.fn(),
    findById: jest.fn(),
    findCurrentByCategory: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    reorder: jest.fn(),
    archive: jest.fn(),
    writeAudit: jest.fn(),
  };
  const unitOfWork: ProductsUnitOfWork = {
    run: async (command, audit) => {
      const result = await command(repository);
      await audit(repository, result);
      return result;
    },
  };
  return { repository, useCase: new ManageProductsUseCase(unitOfWork) };
}
describe("ManageProductsUseCase", () => {
  it("создаёт товар только в существующей категории с атомарным аудитом", async () => {
    const { repository, useCase } = setup();
    repository.categoryExists.mockResolvedValue(true);
    repository.findCurrentByCategory.mockResolvedValue([]);
    repository.create.mockResolvedValue(product);
    await expect(useCase.create(command)).resolves.toEqual(product);
    expect(repository.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_CREATED",
        before: null,
        after: product,
      }),
    );
  });
  it("отклоняет отсутствующую категорию до записи", async () => {
    const { repository, useCase } = setup();
    repository.categoryExists.mockResolvedValue(false);
    await expect(useCase.create(command)).rejects.toThrow(
      "PRODUCT_CATEGORY_NOT_FOUND",
    );
    expect(repository.create).not.toHaveBeenCalled();
  });
  it("сохраняет точный аудит update, reorder и archive", async () => {
    const { repository, useCase } = setup();
    const updated = { ...product, name: "Латте" };
    const tea = { ...product, id: "tea", name: "Чай", sortOrder: 1 };
    repository.categoryExists.mockResolvedValue(true);
    repository.findById
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(product);
    repository.findCurrentByCategory
      .mockResolvedValueOnce([product])
      .mockResolvedValueOnce([product, tea]);
    repository.update.mockResolvedValue(updated);
    repository.reorder.mockResolvedValue([tea, product]);
    repository.archive.mockResolvedValue({
      ...product,
      archivedAt: new Date("2026-08-04T00:00:00.000Z"),
    });
    await expect(
      useCase.update({ ...command, productId: product.id, name: updated.name }),
    ).resolves.toEqual(updated);
    await expect(
      useCase.reorder({
        categoryId: product.categoryId,
        productIds: ["tea", "product"],
        actorId: "actor",
        requestId: "request",
      }),
    ).resolves.toEqual([tea, product]);
    await expect(
      useCase.archive({
        productId: product.id,
        actorId: "actor",
        requestId: "request",
      }),
    ).resolves.toBeUndefined();
    expect(repository.writeAudit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: "PRODUCT_UPDATED",
        before: product,
        after: updated,
      }),
    );
    expect(repository.writeAudit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "PRODUCT_REORDERED",
        productId: "tea",
        before: tea,
        after: tea,
      }),
    );
    expect(repository.writeAudit).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        action: "PRODUCT_REORDERED",
        productId: "product",
        before: product,
        after: product,
      }),
    );
    expect(repository.writeAudit).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        action: "PRODUCT_ARCHIVED",
        before: product,
        after: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });
  it("отклоняет смену типа товара полем type до записи", async () => {
    const { repository, useCase } = setup();
    repository.findById.mockResolvedValue(product);
    await expect(
      useCase.update({
        ...command,
        productId: product.id,
        type: "OTHER",
        priceMinor: 0,
        variants: [],
      }),
    ).rejects.toMatchObject({
      code: "PRODUCT_INVALID",
      fields: [{ path: "type", reason: "Product type cannot be changed" }],
    });
    expect(repository.update).not.toHaveBeenCalled();
  });
  it("отклоняет неполный, дублирующийся и чужой reorder до записи", async () => {
    const { repository, useCase } = setup();
    const tea = { ...product, id: "tea", sortOrder: 1 };
    repository.categoryExists.mockResolvedValue(true);
    repository.findCurrentByCategory.mockResolvedValue([product, tea]);
    for (const productIds of [
      ["product"],
      ["product", "product"],
      ["product", "foreign"],
    ])
      await expect(
        useCase.reorder({
          categoryId: "category",
          productIds,
          actorId: "actor",
          requestId: "request",
        }),
      ).rejects.toThrow("PRODUCT_REORDER_INVALID");
    expect(repository.reorder).not.toHaveBeenCalled();
  });
});
