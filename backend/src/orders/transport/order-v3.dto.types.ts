export type OrderV3ModifierDto = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};
export type OrderV3ItemDto = {
  productId: string;
  priceChoiceId: string | null;
  productName: string;
  portionLabel: string | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: OrderV3ModifierDto[];
};
export type OrderV3Dto = {
  id: string;
  number: string;
  stage: string;
  total: number;
  items: OrderV3ItemDto[];
};
export type CustomerOrderV3Dto = OrderV3Dto & { createdAt: string };
export type CustomerOrdersV3PageDto = {
  orders: CustomerOrderV3Dto[];
  nextCursor: string | null;
};
