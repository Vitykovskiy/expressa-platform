export type CreateOrderV3Item = {
  productId: string;
  priceChoiceId?: string;
  modifierOptionIds: string[];
  quantity: number;
};

export type CreateOrderV3Body = {
  expectedTotal: number;
  items: CreateOrderV3Item[];
};
