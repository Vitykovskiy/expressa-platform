import { GetPublicMenuUseCase } from "./get-public-menu.use-case";
import type {
  PublicMenuCandidates,
  PublicMenuRepository,
} from "./public-menu.repository.types";

const categoryId = "category";
const drinkId = "drink";
const otherId = "other";
const groupId = "milk";

function createCandidates(): PublicMenuCandidates {
  return {
    acceptsNewOrders: true,
    categories: [
      {
        id: categoryId,
        name: "Кофе",
        description: "Напитки",
        sortOrder: 10,
        isActive: true,
        archivedAt: null,
      },
    ],
    products: [
      {
        id: drinkId,
        categoryId,
        type: "DRINK",
        name: "Капучино",
        description: "Кофе с молоком",
        price: null,
        sortOrder: 10,
        isActive: true,
        isAvailable: true,
        archivedAt: null,
      },
      {
        id: otherId,
        categoryId,
        type: "OTHER",
        name: "Круассан",
        description: "Выпечка",
        price: 220,
        sortOrder: 20,
        isActive: true,
        isAvailable: false,
        archivedAt: null,
      },
    ],
    productVariants: [
      {
        id: "small",
        productId: drinkId,
        size: "S",
        price: 280,
        sortOrder: 10,
        isAvailable: true,
        archivedAt: null,
      },
      {
        id: "medium",
        productId: drinkId,
        size: "M",
        price: 320,
        sortOrder: 20,
        isAvailable: false,
        archivedAt: null,
      },
      {
        id: "large",
        productId: drinkId,
        size: "L",
        price: 360,
        sortOrder: 30,
        isAvailable: true,
        archivedAt: null,
      },
    ],
    modifierGroups: [
      {
        id: groupId,
        name: "Молоко",
        selectionType: "single",
        minSelect: 1,
        maxSelect: 1,
        isActive: true,
        archivedAt: null,
      },
    ],
    modifierOptions: [
      {
        id: "regular",
        groupId,
        name: "Обычное",
        priceDelta: 0,
        sortOrder: 10,
        isDefault: true,
        isAvailable: true,
        archivedAt: null,
      },
      {
        id: "oat",
        groupId,
        name: "Овсяное",
        priceDelta: 80,
        sortOrder: 20,
        isDefault: false,
        isAvailable: true,
        archivedAt: null,
      },
    ],
    categoryModifierGroups: [{ categoryId, groupId, sortOrder: 10 }],
  };
}

function createUseCase(candidates: PublicMenuCandidates): GetPublicMenuUseCase {
  const repository: PublicMenuRepository = {
    findCandidates: jest.fn().mockResolvedValue(candidates),
  };

  return new GetPublicMenuUseCase(repository);
}

describe("GetPublicMenuUseCase", () => {
  it("возвращает отсортированный агрегат с наследуемыми группами и оперативной доступностью", async () => {
    const result = await createUseCase(createCandidates()).execute();

    expect(result).toEqual({
      acceptsNewOrders: true,
      categories: [
        {
          id: categoryId,
          name: "Кофе",
          description: "Напитки",
          products: [
            {
              id: drinkId,
              type: "DRINK",
              name: "Капучино",
              description: "Кофе с молоком",
              price: null,
              isAvailable: true,
              variants: [
                { id: "small", size: "S", price: 280, isAvailable: true },
                { id: "medium", size: "M", price: 320, isAvailable: false },
                { id: "large", size: "L", price: 360, isAvailable: true },
              ],
              modifierGroups: [
                {
                  id: groupId,
                  name: "Молоко",
                  selectionType: "single",
                  minSelect: 1,
                  maxSelect: 1,
                  options: [
                    {
                      id: "regular",
                      name: "Обычное",
                      priceDelta: 0,
                      isDefault: true,
                      isAvailable: true,
                    },
                    {
                      id: "oat",
                      name: "Овсяное",
                      priceDelta: 80,
                      isDefault: false,
                      isAvailable: true,
                    },
                  ],
                },
              ],
            },
            {
              id: otherId,
              type: "OTHER",
              name: "Круассан",
              description: "Выпечка",
              price: 220,
              isAvailable: false,
              variants: [],
              modifierGroups: expect.any(Array),
            },
          ],
        },
      ],
    });
  });

  it("исключает неактивные и архивированные сущности, напиток без доступного размера и OTHER с размером", async () => {
    const candidates = createCandidates();
    candidates.categories.push({
      ...candidates.categories[0]!,
      id: "archived-category",
      archivedAt: new Date("2026-08-04T00:00:00.000Z"),
    });
    candidates.products[0]!.isActive = false;
    candidates.products[1]!.id = "other-with-variant";
    candidates.productVariants.push({
      ...candidates.productVariants[0]!,
      id: "other-size",
      productId: "other-with-variant",
    });

    await expect(createUseCase(candidates).execute()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [],
    });
  });

  it("возвращает значение приёма новых заказов из кандидатов репозитория", async () => {
    const candidates = createCandidates();
    candidates.acceptsNewOrders = false;

    await expect(createUseCase(candidates).execute()).resolves.toMatchObject({
      acceptsNewOrders: false,
    });
  });

  it("исключает все товары категории при некорректной обязательной группе", async () => {
    const candidates = createCandidates();
    candidates.modifierOptions[0]!.priceDelta = 1;

    await expect(createUseCase(candidates).execute()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [],
    });
  });

  it("исключает категорию, когда платная добавка отмечена default в обязательной группе", async () => {
    const candidates = createCandidates();
    candidates.modifierOptions[1]!.isDefault = true;

    await expect(createUseCase(candidates).execute()).resolves.toEqual({
      acceptsNewOrders: true,
      categories: [],
    });
  });

  it("не применяет неактивную группу добавок как запасной вариант", async () => {
    const candidates = createCandidates();
    candidates.modifierGroups[0]!.isActive = false;

    const result = await createUseCase(candidates).execute();

    expect(result.categories[0]?.products).toHaveLength(2);
    expect(result.categories[0]?.products[0]?.modifierGroups).toEqual([]);
  });
});
