export type CreateOrderItem = {
  productId: string;
  variantId: string | null;
  modifierOptionIds: string[];
  quantity: number;
};
