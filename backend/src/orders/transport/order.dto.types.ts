export type OrderStageDto = 'CREATED';

export type OrderModifierDto = {
  modifierOptionId: string;
  modifierName: string;
  priceDeltaMinor: number;
};

export type OrderItemDto = {
  productId: string;
  variantId: string | null;
  productName: string;
  size: 'S' | 'M' | 'L' | null;
  quantity: number;
  unitTotalMinor: number;
  lineTotalMinor: number;
  modifiers: OrderModifierDto[];
};
