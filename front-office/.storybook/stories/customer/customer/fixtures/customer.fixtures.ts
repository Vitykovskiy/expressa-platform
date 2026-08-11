import type {
  CustomerJourneyCartItem,
  CustomerJourneyData,
  CustomerJourneyOrder,
  CustomerJourneyOrderStatus,
  CustomerJourneyProduct,
  LegacyFixtureCategory,
  CustomerJourneySeed,
  CustomerJourneyTimeSlot,
} from "../hosts/CustomerJourneyHost.types";
import type {
  PublicMenuCategory,
  PublicMenuProduct,
} from "@/shared/api/public-menu.api";

const images = {
  espresso:
    "https://images.unsplash.com/photo-1764361276489-79b17d9a8782?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3ByZXNzbyUyMHNob3QlMjBjb2ZmZWUlMjBiZWFucyUyMGRhcmt8ZW58MXx8fHwxNzczMDYyMTc2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  americano:
    "https://images.unsplash.com/photo-1576135620690-7819e688efc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXBwdWNjaW5vJTIwY29mZmVlJTIwd2hpdGUlMjBjdXAlMjBtaW5pbWFsfGVufDF8fHwxNzczMDYyMTgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  latte:
    "https://images.unsplash.com/photo-1736813133887-321f44e44224?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXAlMjBsYXR0ZSUyMGFydCUyMGNsb3NlJTIwdXB8ZW58MXx8fDE3NzMwNjIxNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  flatWhite:
    "https://images.unsplash.com/photo-1559648617-374af4ae6c2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3VyJTIwb3ZlciUyMGNvZmZlZSUyMGJyZXdpbmclMjBiYXJpc3RhfGVufDF8fHwxNzczMDYyMTc2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  coldBrew:
    "https://images.unsplash.com/photo-1570470752239-78e3fe00c416?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xkJTIwYnJldyUyMGljZWQlMjBnbGFzc3xlbnwxfHx8MTc3Mjk3NjUxMHww&ixlib=rb-4.1.0&q=80&w=1080",
  croissant:
    "https://images.unsplash.com/photo-1721324447827-437cc25aa653?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9pc3NhbnQlMjBwYXN0cnklMjBiYWtlcnklMjBjYWZlfGVufDF8fHwxNzczMDYyMTc3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  sandwich:
    "https://images.unsplash.com/photo-1666819604634-98dd67634148?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW5kd2ljaCUyMGZvb2QlMjBjYWZlJTIwbHVuY2h8ZW58MXx8fHwxNzczMDYyMTgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
} as const;

const categoryFixture: LegacyFixtureCategory[] = [
  {
    id: "espresso",
    name: "Эспрессо",
    image: images.espresso,
    products: [
      {
        id: "espresso-single",
        name: "Эспрессо",
        description:
          "Классический эспрессо из свежеобжаренных зёрен. Насыщенный вкус с шоколадными нотами.",
        type: "drink",
        image: images.espresso,
        basePrice: 180,
        sizes: [
          { sizeCode: "Single", price: 180 },
          { sizeCode: "Double", price: 220 },
        ],
        addons: [
          { id: "syrup-vanilla", name: "Сироп ваниль", priceRub: 60 },
          { id: "syrup-caramel", name: "Сироп карамель", priceRub: 60 },
        ],
      },
      {
        id: "americano",
        name: "Американо",
        description:
          "Эспрессо с добавлением горячей воды. Мягкий и насыщенный.",
        type: "drink",
        image: images.americano,
        basePrice: 200,
        sizes: [
          { sizeCode: "S", price: 200 },
          { sizeCode: "M", price: 240 },
          { sizeCode: "L", price: 280 },
        ],
      },
    ],
  },
  {
    id: "milk-drinks",
    name: "Молочные напитки",
    image: images.latte,
    products: [
      {
        id: "cappuccino",
        name: "Капучино",
        description:
          "Воздушная молочная пена с эспрессо. Идеальный баланс вкуса.",
        type: "drink",
        image: images.americano,
        basePrice: 280,
        sizes: [
          { sizeCode: "S", price: 280 },
          { sizeCode: "M", price: 320 },
          { sizeCode: "L", price: 360 },
        ],
        addons: [
          { id: "oat-milk", name: "Овсяное молоко", priceRub: 80 },
          { id: "almond-milk", name: "Миндальное молоко", priceRub: 80 },
          { id: "syrup-vanilla", name: "Сироп ваниль", priceRub: 60 },
        ],
      },
      {
        id: "latte",
        name: "Латте",
        description:
          "Нежный напиток из молока и эспрессо с красивым рисунком на пене.",
        type: "drink",
        image: images.latte,
        basePrice: 300,
        sizes: [
          { sizeCode: "S", price: 300 },
          { sizeCode: "M", price: 340 },
          { sizeCode: "L", price: 380 },
        ],
        addons: [
          { id: "oat-milk", name: "Овсяное молоко", priceRub: 80 },
          { id: "syrup-caramel", name: "Сироп карамель", priceRub: 60 },
          { id: "syrup-vanilla", name: "Сироп ваниль", priceRub: 60 },
        ],
      },
      {
        id: "flat-white",
        name: "Флэт уайт",
        description:
          "Двойной эспрессо с небольшим количеством микропены. Крепкий и насыщенный.",
        type: "drink",
        image: images.flatWhite,
        basePrice: 320,
      },
    ],
  },
  {
    id: "cold-drinks",
    name: "Холодные напитки",
    image: images.coldBrew,
    products: [
      {
        id: "cold-brew",
        name: "Колд брю",
        description:
          "Кофе холодного заваривания. Мягкий, насыщенный, без кислинки.",
        type: "drink",
        image: images.coldBrew,
        basePrice: 350,
        sizes: [
          { sizeCode: "M", price: 350 },
          { sizeCode: "L", price: 400 },
        ],
      },
      {
        id: "iced-latte",
        name: "Айс латте",
        description: "Охлаждённый латте со льдом. Освежающий и насыщенный.",
        type: "drink",
        image: images.latte,
        basePrice: 330,
        sizes: [
          { sizeCode: "M", price: 330 },
          { sizeCode: "L", price: 370 },
        ],
        addons: [
          { id: "oat-milk", name: "Овсяное молоко", priceRub: 80 },
          { id: "syrup-caramel", name: "Сироп карамель", priceRub: 60 },
        ],
      },
    ],
  },
  {
    id: "food",
    name: "Еда",
    image: images.croissant,
    products: [
      {
        id: "croissant",
        name: "Круассан",
        description: "Свежевыпеченный слоёный круассан из масляного теста.",
        type: "food",
        image: images.croissant,
        basePrice: 220,
      },
      {
        id: "sandwich",
        name: "Сэндвич с курицей",
        description: "Сытный сэндвич с куриным филе, овощами и соусом.",
        type: "food",
        image: images.sandwich,
        basePrice: 380,
      },
    ],
  },
];

const slotFixture: CustomerJourneyTimeSlot[] = [
  {
    id: "s1",
    date: "Сегодня",
    timeFrom: "10:00",
    timeTo: "10:15",
    available: 3,
    capacity: 5,
  },
  {
    id: "s2",
    date: "Сегодня",
    timeFrom: "10:15",
    timeTo: "10:30",
    available: 0,
    capacity: 5,
  },
  {
    id: "s3",
    date: "Сегодня",
    timeFrom: "10:30",
    timeTo: "10:45",
    available: 2,
    capacity: 5,
  },
  {
    id: "s4",
    date: "Сегодня",
    timeFrom: "10:45",
    timeTo: "11:00",
    available: 4,
    capacity: 5,
  },
  {
    id: "s5",
    date: "Сегодня",
    timeFrom: "11:00",
    timeTo: "11:15",
    available: 5,
    capacity: 5,
  },
  {
    id: "s6",
    date: "Сегодня",
    timeFrom: "11:15",
    timeTo: "11:30",
    available: 1,
    capacity: 5,
  },
];
const orderFixture: CustomerJourneyOrder[] = [
  {
    id: "1042",
    createdAt: "9 мар, 10:32",
    status: "ready",
    totalRub: 720,
    slotDate: "9 мар",
    slotTimeFrom: "10:45",
    slotTimeTo: "11:00",
    items: [
      {
        productName: "Капучино",
        size: "M",
        quantity: 1,
        lineTotalRub: 400,
        addons: [{ name: "Овсяное молоко", quantity: 1 }],
      },
      {
        productName: "Капучино",
        size: "M",
        quantity: 1,
        lineTotalRub: 320,
        addons: [],
      },
    ],
  },
  {
    id: "1039",
    createdAt: "8 мар, 14:15",
    status: "completed",
    totalRub: 820,
    slotDate: "8 мар",
    slotTimeFrom: "14:30",
    slotTimeTo: "14:45",
    items: [
      {
        productName: "Латте",
        size: "L",
        quantity: 1,
        lineTotalRub: 380,
        addons: [],
      },
      { productName: "Круассан", quantity: 2, lineTotalRub: 440, addons: [] },
    ],
  },
  {
    id: "1031",
    createdAt: "5 мар, 09:07",
    status: "completed",
    totalRub: 700,
    slotDate: "5 мар",
    slotTimeFrom: "09:15",
    slotTimeTo: "09:30",
    items: [
      { productName: "Флэт уайт", quantity: 1, lineTotalRub: 320, addons: [] },
      {
        productName: "Сэндвич с курицей",
        quantity: 1,
        lineTotalRub: 380,
        addons: [],
      },
    ],
  },
];
const statusLabelFixture: Record<CustomerJourneyOrderStatus, string> = {
  pending: "Ожидает",
  preparing: "Готовится",
  ready: "Готов",
  completed: "Выдан",
  cancelled: "Отменён",
};
const populatedCartFixture: CustomerJourneyCartItem[] = [
  {
    id: "1",
    productId: "cappuccino",
    productName: "Капучино",
    type: "DRINK",
    size: "M",
    sizePrice: 320,
    addons: [{ id: "oat-milk", name: "Овсяное молоко", priceRub: 80 }],
    quantity: 2,
    lineTotalRub: 800,
    unitTotalMinor: 40000,
    lineTotalMinor: 80000,
    selectedVariant: { id: "cappuccino-m", size: "M", priceMinor: 32000 },
    selectedModifierOptions: [
      {
        groupId: "cappuccino-addons",
        id: "oat-milk",
        name: "Овсяное молоко",
        priceDeltaMinor: 8000,
      },
    ],
  },
];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function assertOrderTotals(orders: CustomerJourneyOrder[]): void {
  for (const order of orders) {
    const itemsTotalRub = order.items.reduce(
      (total, item) => total + item.lineTotalRub,
      0,
    );

    if (order.totalRub !== itemsTotalRub) {
      throw new Error(
        `Заказ ${order.id}: сумма ${order.totalRub} не равна сумме позиций ${itemsTotalRub}`,
      );
    }
  }
}

export function createCustomerDefaults(): CustomerJourneyData {
  const orders = clone(orderFixture);
  assertOrderTotals(orders);

  return {
    categories: clone(categoryFixture).map(toPublicCategory),
    slots: clone(slotFixture),
    orders,
    statusLabels: clone(statusLabelFixture),
  };
}

function toPublicCategory(category: LegacyFixtureCategory): PublicMenuCategory {
  return {
    id: category.id,
    name: category.name,
    description: "",
    products: category.products.map(toPublicProduct),
  };
}

function toPublicProduct(product: CustomerJourneyProduct): PublicMenuProduct {
  const modifierGroups = product.addons?.length
    ? [
        {
          id: `${product.id}-addons`,
          name: "Добавки",
          selectionType: "multiple" as const,
          minSelect: 0,
          maxSelect: product.addons.length,
          options: product.addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            priceDeltaMinor: addon.priceRub * 100,
            isDefault: false,
            isAvailable: true,
          })),
        },
      ]
    : [];
  if (product.type === "drink") {
    const sizes = product.sizes?.length
      ? product.sizes
      : [{ sizeCode: "M", price: product.basePrice }];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      type: "DRINK",
      isAvailable: true,
      modifierGroups,
      priceMinor: null,
      variants: sizes.map((size, index) => ({
        id: `${product.id}-${size.sizeCode.toLowerCase()}-${index}`,
        size: normalizeSize(size.sizeCode, index),
        priceMinor: size.price * 100,
        isAvailable: true,
      })),
    };
  }
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    type: "OTHER",
    isAvailable: true,
    modifierGroups,
    priceMinor: product.basePrice * 100,
    variants: [],
  };
}

function normalizeSize(size: string, index: number): "S" | "M" | "L" {
  if (size === "S" || size === "M" || size === "L") return size;
  return index === 0 ? "S" : "M";
}
export function createCustomerShellSeed(
  overrides: Partial<CustomerJourneySeed> = {},
): CustomerJourneySeed {
  return {
    currentScreen: { id: "menu" },
    navigationStack: [],
    auth: {
      step: "phone",
      name: "",
      phone: "",
      errorMessage: "",
      verified: false,
    },
    cartItems: [],
    selectedSlotId: null,
    data: createCustomerDefaults(),
    ...clone(overrides),
  };
}
export function createPopulatedCartItems(): CustomerJourneyCartItem[] {
  return clone(populatedCartFixture);
}
