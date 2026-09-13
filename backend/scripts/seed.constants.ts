import type {
  CatalogSeed,
  E2eSeedScenarioDefinition,
  ModifierGroupSeed,
  ModifierOptionSeed,
  ProductSeed,
  ProductVariantSeed,
} from "./seed.types";

const coffeeCategoryId = "00000000-0000-4000-8000-000000000001";
const bakeryCategoryId = "00000000-0000-4000-8000-000000000002";
const cappuccinoId = "00000000-0000-4000-8000-000000000010";
const espressoId = "00000000-0000-4000-8000-000000000020";
const croissantId = "00000000-0000-4000-8000-000000000030";
const unavailableDessertId = "00000000-0000-4000-8000-000000000040";
const unpublishedDrinkId = "00000000-0000-4000-8000-000000000050";
const milkGroupId = "00000000-0000-4000-8000-000000000100";

export const e2eSeedScenarioEnvironmentVariable = "E2E_SEED_SCENARIO";

export const e2eSeedScenarios = [
  "canonical",
  "customer-new",
  "customer-existing",
  "intake-closed",
  "modifier-unavailable",
  "product-unavailable",
  "size-unavailable",
  "catalog-mutation",
  "order-created",
  "order-accepted",
  "order-preparing",
  "order-ready",
  "order-issued",
  "order-snapshot",
  "order-repeat-unavailable",
  "order-repeat-partial",
  "customer-history",
  "queue-populated",
] as const;

export const e2eSeedScenarioDefinitions: Readonly<
  Record<(typeof e2eSeedScenarios)[number], E2eSeedScenarioDefinition>
> = {
  canonical: {
    customerState: "new",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "customer-new": {
    customerState: "new",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "customer-existing": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "intake-closed": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: false,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "modifier-unavailable": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "modifier",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "product-unavailable": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "product",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "size-unavailable": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "size",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "catalog-mutation": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-created": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["CREATED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-accepted": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["ACCEPTED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-preparing": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["PREPARING"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-ready": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["READY"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-issued": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["ISSUED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-snapshot": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["CREATED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-repeat-unavailable": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["ISSUED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "order-repeat-partial": {
    customerState: "existing",
    secondCustomerState: "new",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["ISSUED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
  "customer-history": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: [],
    customerHistoryCount: 21,
    includeForeignOrder: true,
  },
  "queue-populated": {
    customerState: "existing",
    secondCustomerState: "existing",
    acceptsNewOrders: true,
    unavailableTarget: "none",
    orderStages: ["CREATED", "ACCEPTED", "PREPARING", "READY", "ISSUED"],
    customerHistoryCount: 0,
    includeForeignOrder: false,
  },
};

export const e2eSeedIds = {
  coffeeCategory: coffeeCategoryId,
  cappuccino: cappuccinoId,
  cappuccinoMedium: "00000000-0000-4000-8000-000000000012",
  unavailableDessert: unavailableDessertId,
  regularMilk: "00000000-0000-4000-8000-000000000101",
  oatMilk: "00000000-0000-4000-8000-000000000102",
} as const;

export const catalogSeed: CatalogSeed = {
  categories: [
    {
      id: coffeeCategoryId,
      name: "Кофе",
      description: "Кофейные напитки.",
      sortOrder: 10,
      isActive: true,
    },
    {
      id: bakeryCategoryId,
      name: "Выпечка",
      description: "Свежая выпечка.",
      sortOrder: 20,
      isActive: true,
    },
  ],
  products: [
    {
      id: cappuccinoId,
      categoryId: coffeeCategoryId,
      type: "DRINK",
      name: "Капучино",
      description: "Эспрессо с молочной пеной.",
      price: null,
      sortOrder: 10,
      isActive: true,
      isAvailable: true,
    },
    {
      id: espressoId,
      categoryId: coffeeCategoryId,
      type: "DRINK",
      name: "Эспрессо",
      description: "Классический двойной эспрессо.",
      price: null,
      sortOrder: 20,
      isActive: true,
      isAvailable: true,
    },
    {
      id: croissantId,
      categoryId: bakeryCategoryId,
      type: "OTHER",
      name: "Круассан",
      description: "Слоёный круассан из масляного теста.",
      price: 220,
      sortOrder: 10,
      isActive: true,
      isAvailable: true,
    },
    {
      id: unavailableDessertId,
      categoryId: bakeryCategoryId,
      type: "OTHER",
      name: "Чизкейк",
      description: "Десерт временно недоступен.",
      price: 280,
      sortOrder: 20,
      isActive: true,
      isAvailable: false,
    },
    {
      id: unpublishedDrinkId,
      categoryId: coffeeCategoryId,
      type: "DRINK",
      name: "Тестовый напиток",
      description: "Непубликуемый кандидат без размеров.",
      price: null,
      sortOrder: 30,
      isActive: false,
      isAvailable: true,
    },
  ],
  productVariants: [
    {
      id: "00000000-0000-4000-8000-000000000011",
      productId: cappuccinoId,
      size: "S",
      price: 280,
      sortOrder: 10,
      isAvailable: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      productId: cappuccinoId,
      size: "M",
      price: 320,
      sortOrder: 20,
      isAvailable: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      productId: cappuccinoId,
      size: "L",
      price: 360,
      sortOrder: 30,
      isAvailable: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000021",
      productId: espressoId,
      size: "S",
      price: 200,
      sortOrder: 10,
      isAvailable: true,
    },
  ],
  modifierGroups: [
    {
      id: milkGroupId,
      name: "Молоко",
      selectionType: "single",
      minSelect: 1,
      maxSelect: 1,
      isActive: true,
    },
  ],
  modifierOptions: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      groupId: milkGroupId,
      name: "Обычное молоко",
      priceDelta: 0,
      sortOrder: 10,
      isDefault: true,
      isAvailable: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      groupId: milkGroupId,
      name: "Овсяное молоко",
      priceDelta: 80,
      sortOrder: 20,
      isDefault: false,
      isAvailable: true,
    },
  ],
  categoryModifierGroups: [
    {
      categoryId: coffeeCategoryId,
      groupId: milkGroupId,
      sortOrder: 10,
    },
  ],
  productModifierGroups: [],
};

export const categoryUpsertSql = `
  INSERT INTO categories (id, name, description, sort_order, is_active, archived_at)
  VALUES ($1, $2, $3, $4, $5, NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    archived_at = NULL
`;

export const productUpsertSql = `
  INSERT INTO products (
    id, category_id, type, name, description, display_label, price, sort_order, is_active, is_available, archived_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_label = EXCLUDED.display_label,
    price = EXCLUDED.price,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const productVariantUpsertSql = `
  INSERT INTO product_variants (id, product_id, size, display_label, price, sort_order, is_available, archived_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
  ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    size = EXCLUDED.size,
    display_label = EXCLUDED.display_label,
    price = EXCLUDED.price,
    sort_order = EXCLUDED.sort_order,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const modifierGroupUpsertSql = `
  INSERT INTO modifier_groups (id, name, selection_type, min_select, max_select, is_active, archived_at)
  VALUES ($1, $2, $3, $4, $5, $6, NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    selection_type = EXCLUDED.selection_type,
    min_select = EXCLUDED.min_select,
    max_select = EXCLUDED.max_select,
    is_active = EXCLUDED.is_active,
    archived_at = NULL
`;

export const modifierOptionUpsertSql = `
  INSERT INTO modifier_options (
    id, group_id, name, price_delta, sort_order, is_default, is_available, archived_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
  ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    name = EXCLUDED.name,
    price_delta = EXCLUDED.price_delta,
    sort_order = EXCLUDED.sort_order,
    is_default = EXCLUDED.is_default,
    is_available = EXCLUDED.is_available,
    archived_at = NULL
`;

export const categoryModifierGroupUpsertSql = `
  INSERT INTO category_modifier_groups (category_id, group_id, sort_order)
  VALUES ($1, $2, $3)
  ON CONFLICT (category_id, group_id) DO UPDATE SET
    sort_order = EXCLUDED.sort_order
`;

export const productModifierGroupUpsertSql = `
  INSERT INTO product_modifier_groups (product_id, group_id, sort_order)
  VALUES ($1, $2, $3)
  ON CONFLICT (product_id, group_id) DO UPDATE SET
    sort_order = EXCLUDED.sort_order
`;

const customerCategoryIds = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
  "10000000-0000-4000-8000-000000000007",
] as const;

const customerProductRows = [
  [
    "101",
    0,
    "DRINK",
    "Какао",
    "На выбор: сладкое или несладкое",
    [
      ["250 мл", 240],
      ["350 мл", 280],
    ],
  ],
  [
    "102",
    0,
    "DRINK",
    "Горячий шоколад",
    "",
    [
      ["250 мл", 260],
      ["350 мл", 300],
    ],
  ],
  [
    "103",
    0,
    "DRINK",
    "Оранжет",
    "Апельсиновый какао без молока",
    [
      ["250 мл", 280],
      ["350 мл", 320],
    ],
  ],
  [
    "104",
    0,
    "DRINK",
    "Сырный шок",
    "Сырный какао",
    [
      ["250 мл", 280],
      ["350 мл", 320],
    ],
  ],
  [
    "105",
    0,
    "DRINK",
    "Фундучный какао",
    "Какао на пасте из фундучных ядер",
    [
      ["250 мл", 280],
      ["350 мл", 320],
    ],
  ],
  [
    "106",
    1,
    "DRINK",
    "Чай китайский",
    "Крутой китайский чай!",
    [["350 мл", 250]],
  ],
  [
    "107",
    1,
    "DRINK",
    "Чай летний",
    "Китайский чай + цедра лимона + перечная мята",
    [["350 мл", 300]],
  ],
  [
    "108",
    2,
    "DRINK",
    "Сироп а лё",
    "От фр. sirop à l'eau: тоник + сироп",
    [["450 мл", 250]],
  ],
  ["109", 2, "DRINK", "Лимонад «Проспект МИРинда»", "", [["450 мл", 280]]],
  [
    "110",
    2,
    "DRINK",
    "Коктейль «Нежность»",
    "Персиковый сок + мороженое",
    [["450 мл", 330]],
  ],
  ["111", 2, "DRINK", "Молочный коктейль", "", [["450 мл", 330]]],
  ["112", 3, "OTHER", "Антуччи", "Наши кофейные сухарики", 100, "100 г"],
  ["113", 3, "OTHER", "Круассан", "", 170, null],
  [
    "114",
    3,
    "DRINK",
    "Мороженое",
    "Саровское; рекомендован кофейный сироп",
    [
      ["50 г", 110],
      ["100 г", 190],
    ],
  ],
  ["115", 3, "OTHER", "Маффин", "", 200, null],
  ["116", 3, "OTHER", "Сырники", "Можно добавить джем за 30 ₽", 220, "2 шт."],
  [
    "117",
    3,
    "OTHER",
    "Штрудель",
    "Постный: вишнёвый, яблочный или маковый",
    240,
    null,
  ],
  ["118", 3, "OTHER", "Горячий бутерброд", "Да, тот самый!", 300, null],
  ["119", 4, "DRINK", "Эспрессо", "Двойной эспрессо", [["65 мл", 180]]],
  [
    "120",
    4,
    "DRINK",
    "Американо",
    "",
    [
      ["250 мл", 220],
      ["350 мл", 260],
    ],
  ],
  [
    "121",
    4,
    "DRINK",
    "Флэт уайт",
    "Как капучино, только покрепче",
    [["180 мл", 240]],
  ],
  [
    "122",
    4,
    "DRINK",
    "Капучино",
    "",
    [
      ["250 мл", 250],
      ["350 мл", 290],
    ],
  ],
  [
    "123",
    4,
    "DRINK",
    "Латте",
    "Как капучино, только помягче",
    [["350 мл", 270]],
  ],
  [
    "124",
    5,
    "DRINK",
    "Раф",
    "",
    [
      ["250 мл", 270],
      ["350 мл", 310],
    ],
  ],
  ["125", 5, "DRINK", "Сырный раф", "", [["350 мл", 330]]],
  ["126", 5, "DRINK", "Раффундук", "Раф с фундучной пастой", [["350 мл", 330]]],
  [
    "127",
    5,
    "DRINK",
    "Моккачино",
    "Шоколадный капучино",
    [
      ["250 мл", 290],
      ["350 мл", 340],
    ],
  ],
  ["128", 6, "DRINK", "Айс-латте", "Холодный латте", [["350 мл", 290]]],
  ["129", 6, "DRINK", "Гляссе", "Американо + мороженое", [["350 мл", 290]]],
  [
    "130",
    6,
    "DRINK",
    "Бамбл",
    "Эспрессо + апельсиновый сок + сироп",
    [["350 мл", 330]],
  ],
  [
    "131",
    6,
    "DRINK",
    "Эспрессо-тоник",
    "Эспрессо + тоник + сироп",
    [["350 мл", 330]],
  ],
  [
    "132",
    6,
    "DRINK",
    "Кофе-шейк",
    "Молочный коктейль + эспрессо",
    [["450 мл", 350]],
  ],
  [
    "133",
    6,
    "DRINK",
    "Аффогато",
    "Десерт: мороженое + эспрессо",
    [["110 г", 300]],
  ],
] as const;

const customerProductId = (suffix: string) =>
  `10000000-0000-4000-8000-000000000${suffix}`;
const customerVariantId = (suffix: string, variant: number) =>
  `10000000-0000-4000-8100-${suffix.padStart(8, "0")}${variant.toString().padStart(4, "0")}`;

const customerProducts: ProductSeed[] = customerProductRows.map(
  (row, sortOrder) => {
    const [
      suffix,
      categoryIndex,
      type,
      name,
      description,
      pricing,
      displayLabel,
    ] = row;
    const isDrink = type === "DRINK";
    return {
      id: customerProductId(suffix),
      categoryId: customerCategoryIds[categoryIndex as number]!,
      type,
      name,
      description,
      displayLabel: isDrink ? null : (displayLabel ?? null),
      price: isDrink ? null : (pricing as number),
      sortOrder,
      isActive: true,
      isAvailable: true,
    };
  },
);

const customerProductVariants: ProductVariantSeed[] =
  customerProductRows.flatMap((row) => {
    const [suffix, , type, , , pricing] = row;
    if (type !== "DRINK") return [];
    return (pricing as readonly (readonly [string, number])[]).map(
      ([displayLabel, price], sortOrder) => ({
        id: customerVariantId(suffix, sortOrder + 1),
        productId: customerProductId(suffix),
        size: (sortOrder === 0 ? "S" : "M") as "S" | "M",
        displayLabel,
        price,
        sortOrder,
        isAvailable: true,
      }),
    );
  });

const customerModifierGroupRows: readonly (readonly [
  string,
  string,
  "single",
  number,
  number,
])[] = [
  ["201", "Сладость", "single", 1, 1],
  ["202", "Альт. молоко", "single", 0, 1],
  ["203", "Декаф", "single", 0, 1],
  ["204", "Джем", "single", 0, 1],
  ["205", "Кофейный сироп", "single", 0, 1],
  ["206", "Маршмеллоу", "single", 0, 1],
  ["207", "Налить воды", "single", 0, 1],
  ["208", "Доп. шот эспрессо", "single", 0, 1],
];
const customerModifierGroups: ModifierGroupSeed[] =
  customerModifierGroupRows.map(
    ([suffix, name, selectionType, minSelect, maxSelect]) => ({
      id: customerProductId(suffix),
      name,
      selectionType: selectionType as "single",
      minSelect,
      maxSelect,
      isActive: true,
    }),
  );

const customerModifierOptionRows: readonly (readonly [
  string,
  string,
  string,
  number,
  boolean,
])[] = [
  ["301", "201", "Сладкое", 0, true],
  ["302", "201", "Несладкое", 0, false],
  ["303", "202", "Альт. молоко", 40, false],
  ["304", "203", "Декаф", 40, false],
  ["305", "204", "Джем", 30, false],
  ["306", "205", "Кофейный сироп", 40, false],
  ["307", "206", "Маршмеллоу", 30, false],
  ["308", "207", "Налить воды", 40, false],
  ["309", "208", "Доп. шот эспрессо", 70, false],
];
const customerModifierOptions: ModifierOptionSeed[] =
  customerModifierOptionRows.map(
    ([suffix, groupSuffix, name, priceDelta, isDefault], sortOrder) => ({
      id: customerProductId(suffix),
      groupId: customerProductId(groupSuffix),
      name,
      priceDelta,
      sortOrder,
      isDefault,
      isAvailable: true,
    }),
  );

const productIds = (suffixes: readonly string[]) =>
  suffixes.map(customerProductId);
const customerProductModifierGroups = [
  ...productIds(["101"]).map((productId) => [productId, "201"] as const),
  ...productIds([
    "101",
    "102",
    "104",
    "105",
    "121",
    "122",
    "123",
    "124",
    "125",
    "126",
    "127",
    "128",
  ]).map((productId) => [productId, "202"] as const),
  ...productIds([
    "119",
    "120",
    "121",
    "122",
    "123",
    "124",
    "125",
    "126",
    "127",
    "128",
    "129",
    "130",
    "131",
    "132",
    "133",
  ]).flatMap((productId) => [
    [productId, "203"] as const,
    [productId, "208"] as const,
  ]),
  ...productIds(["116"]).map((productId) => [productId, "204"] as const),
  ...productIds(["114"]).map((productId) => [productId, "205"] as const),
  ...productIds(["101", "102", "104", "105"]).map(
    (productId) => [productId, "206"] as const,
  ),
  ...productIds(["106", "107"]).map((productId) => [productId, "207"] as const),
].map(([productId, groupSuffix], sortOrder) => ({
  productId,
  groupId: customerProductId(groupSuffix),
  sortOrder,
}));

export const customerMenuCatalogSeed: CatalogSeed = {
  categories: [
    "Какао / шоколад",
    "Чай",
    "Холодные напитки",
    "Поесть",
    "Кофе классический",
    "Кофе сладкий",
    "Холодный кофе",
  ].map((name, sortOrder) => ({
    id: customerCategoryIds[sortOrder]!,
    name,
    description: "",
    sortOrder,
    isActive: true,
  })),
  products: customerProducts,
  productVariants: customerProductVariants,
  modifierGroups: customerModifierGroups,
  modifierOptions: customerModifierOptions,
  categoryModifierGroups: [],
  productModifierGroups: customerProductModifierGroups,
};

export const developmentCatalogOwnedIds = {
  categories: [...customerCategoryIds, coffeeCategoryId, bakeryCategoryId],
  products: [
    ...customerProducts.map((product) => product.id),
    cappuccinoId,
    espressoId,
    croissantId,
    unavailableDessertId,
    unpublishedDrinkId,
  ],
  variants: [
    ...customerProductVariants.map((variant) => variant.id),
    "00000000-0000-4000-8000-000000000011",
    "00000000-0000-4000-8000-000000000012",
    "00000000-0000-4000-8000-000000000013",
    "00000000-0000-4000-8000-000000000021",
  ],
  groups: [...customerModifierGroups.map((group) => group.id), milkGroupId],
  options: [
    ...customerModifierOptions.map((option) => option.id),
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
  ],
} as const;
