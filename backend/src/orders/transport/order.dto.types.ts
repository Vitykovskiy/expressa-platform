export type OrderStageDto = 'CREATED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'ISSUED';

export type OrderModifierDto = {
  modifierOptionId: string;
  modifierName: string;
  priceDelta: number;
};

export type OrderItemDto = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: 'S' | 'M' | 'L' | null;
  quantity: number;
  unitTotal: number;
  lineTotal: number;
  modifiers: OrderModifierDto[];
};

export type CustomerOrderDto = {
  id: string;
  number: string;
  createdAt: string;
  stage: OrderStageDto;
  total: number;
  snapshot: readonly OrderItemDto[];
};

export type CustomerOrdersPageDto = {
  orders: readonly CustomerOrderDto[];
  nextCursor: string | null;
};
