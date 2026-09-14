import {
  ManageProductsUseCase,
  ManageV3ProductsUseCase,
} from "./manage-products.use-case";
import type {
  ProductsRepository,
  ProductsUnitOfWork,
  V3ProductsRepository,
  V3ProductsUnitOfWork,
} from "./products.repository.types";
const product = {
  id: "product",
  categoryId: "category",
  type: "DRINK" as const,
  name: "Капучино",
  description: "",
  price: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  archivedAt: null,
  variants: [
    {
      id: "variant",
      productId: "product",
      size: "M" as const,
      price: 320,
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
  price: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
  variants: [
    { size: "M" as const, price: 320, sortOrder: 0, isAvailable: true },
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
        price: 0,
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

describe("ManageV3ProductsUseCase", () => {
  const v3Product = {
    id: "product",
    categoryId: "category",
    name: "Капучино",
    description: "",
    price: null,
    portionLabel: null,
    priceChoices: [
      {
        id: "small",
        productId: "product",
        portionLabel: "250 мл",
        price: 250,
        sortOrder: 0,
        isAvailable: true,
        archivedAt: null,
      },
      {
        id: "large",
        productId: "product",
        portionLabel: "350 мл",
        price: 300,
        sortOrder: 1,
        isAvailable: true,
        archivedAt: null,
      },
    ],
    sortOrder: 0,
    isActive: true,
    isAvailable: true,
    archivedAt: null,
  };
  const command = {
    categoryId: "category",
    name: "Капучино",
    description: "",
    price: null,
    portionLabel: null,
    priceChoices: [
      {
        id: "small",
        portionLabel: "250 мл",
        price: 250,
        sortOrder: 0,
        isAvailable: true,
      },
      {
        id: "large",
        portionLabel: "350 мл",
        price: 300,
        sortOrder: 1,
        isAvailable: true,
      },
    ],
    sortOrder: 0,
    isActive: true,
    isAvailable: true,
    actorId: "actor",
    requestId: "request",
  };
  function setupV3() {
    const repository: jest.Mocked<V3ProductsRepository> = {
      categoryExists: jest.fn(),
      findV3ById: jest.fn(),
      findCurrentV3ByCategory: jest.fn(),
      createV3: jest.fn(),
      updateV3: jest.fn(),
      reorderV3: jest.fn(),
      archiveV3: jest.fn(),
      writeV3Audit: jest.fn(),
    };
    const unitOfWork: V3ProductsUnitOfWork = {
      runV3: async (work, audit) => {
        const result = await work(repository);
        await audit(repository, result);
        return result;
      },
    };
    return { repository, useCase: new ManageV3ProductsUseCase(unitOfWork) };
  }
  it("writes audit context for v3 create, update, reorder and archive", async () => {
    const { repository, useCase } = setupV3();
    const tea = { ...v3Product, id: "tea", name: "Чай", sortOrder: 1 };
    repository.categoryExists.mockResolvedValue(true);
    repository.createV3.mockResolvedValue(v3Product);
    repository.findV3ById
      .mockResolvedValueOnce(v3Product)
      .mockResolvedValueOnce(v3Product);
    repository.updateV3.mockResolvedValue({ ...v3Product, name: "Латте" });
    repository.findCurrentV3ByCategory.mockResolvedValue([v3Product, tea]);
    repository.reorderV3.mockResolvedValue([tea, v3Product]);
    repository.archiveV3.mockResolvedValue({
      ...v3Product,
      archivedAt: new Date("2026-09-14T00:00:00.000Z"),
    });
    await useCase.create(command);
    await useCase.update({
      ...command,
      productId: v3Product.id,
      name: "Латте",
    });
    await useCase.reorder({
      categoryId: "category",
      productIds: ["tea", "product"],
      actorId: "actor",
      requestId: "request",
    });
    await useCase.archive({
      productId: "product",
      actorId: "actor",
      requestId: "request",
    });
    expect(repository.writeV3Audit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: "PRODUCT_CREATED",
        actorId: "actor",
        requestId: "request",
      }),
    );
    expect(repository.writeV3Audit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ action: "PRODUCT_UPDATED" }),
    );
    expect(repository.writeV3Audit).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        action: "PRODUCT_REORDERED",
        productId: "tea",
      }),
    );
    expect(repository.writeV3Audit).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({ action: "PRODUCT_ARCHIVED" }),
    );
  });
  it("rejects a non-full v3 reorder before writing", async () => {
    const { repository, useCase } = setupV3();
    repository.categoryExists.mockResolvedValue(true);
    repository.findCurrentV3ByCategory.mockResolvedValue([v3Product]);
    await expect(
      useCase.reorder({
        categoryId: "category",
        productIds: [],
        actorId: "actor",
        requestId: "request",
      }),
    ).rejects.toMatchObject({ code: "PRODUCT_INVALID" });
    expect(repository.reorderV3).not.toHaveBeenCalled();
  });
});
