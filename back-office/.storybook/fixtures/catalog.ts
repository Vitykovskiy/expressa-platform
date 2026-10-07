import type {
  Category,
  ModifierGroup,
  Product,
} from "../../src/pages/admin/menu/catalog.types";
import type { AvailabilityItem } from "../../src/shared/api/availability.api.types";
import type {
  OrderDetails,
  OrderListItem,
} from "../../src/shared/api/orders.api.types";

export const category: Category = {
  id: "coffee",
  name: "Кофе",
  description: "Классические напитки",
  sortOrder: 0,
  isActive: true,
};
export const product: Product = {
  id: "cappuccino",
  categoryId: "coffee",
  name: "Капучино",
  description: "Эспрессо и молоко",
  price: 290,
  portionLabel: null,
  sortOrder: 0,
  isActive: true,
  isAvailable: true,
};
export const modifierGroup: ModifierGroup = {
  id: "milk",
  name: "Молоко",
  selectionType: "single",
  minSelect: 0,
  maxSelect: 1,
  isActive: true,
  options: [
    {
      id: "oat",
      groupId: "milk",
      name: "Овсяное",
      priceDelta: 60,
      sortOrder: 0,
      isDefault: false,
      isAvailable: true,
    },
  ],
};
export const availabilityItems: readonly AvailabilityItem[] = [
  {
    id: "cappuccino",
    label: "Капучино",
    sublabel: "300 мл",
    type: "product",
    isAvailable: true,
  },
  {
    id: "oat",
    label: "Овсяное молоко",
    sublabel: "Добавка",
    type: "modifier",
    isAvailable: false,
  },
];
export const order: OrderListItem = {
  id: "order-42",
  number: "42",
  createdAt: "2026-09-21T10:30:00.000Z",
  total: 590,
  stage: "CREATED",
};
export const orderDetails: OrderDetails = {
  ...order,
  customer: { id: "customer-1", phoneE164: "+79000000000" },
  snapshot: [
    {
      productId: "cappuccino",
      priceChoiceId: null,
      portionLabel: "300 мл",
      productName: "Капучино",
      quantity: 2,
      unitTotal: 295,
      lineTotal: 590,
      modifiers: [],
    },
  ],
  events: [],
};
