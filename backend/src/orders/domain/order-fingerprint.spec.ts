import { createOrderFingerprint } from './order-fingerprint';
import type { OrderRequest } from './order.types';

describe('createOrderFingerprint', () => {
  it('канонизирует порядок позиций и добавок', () => {
    const first: OrderRequest = {
      totalMinor: 10_000,
      items: [
        { productId: 'tea', variantId: null, modifierOptionIds: ['lemon', 'sugar'], quantity: 1 },
        { productId: 'coffee', variantId: 'medium', modifierOptionIds: [], quantity: 2 },
      ],
    };
    const sameRequestDifferentOrder: OrderRequest = {
      totalMinor: 10_000,
      items: [
        { productId: 'coffee', variantId: 'medium', modifierOptionIds: [], quantity: 2 },
        { productId: 'tea', variantId: null, modifierOptionIds: ['sugar', 'lemon'], quantity: 1 },
      ],
    };

    expect(createOrderFingerprint(first)).toBe(createOrderFingerprint(sameRequestDifferentOrder));
    expect(createOrderFingerprint(first)).not.toBe(createOrderFingerprint({ ...first, totalMinor: 10_001 }));
  });

  it('использует точный порядок кодовых единиц Unicode', () => {
    const composed = 'é';
    const decomposed = 'e\u0301';
    const first: OrderRequest = {
      totalMinor: 10_000,
      items: [{ productId: composed, variantId: null, modifierOptionIds: [composed, decomposed], quantity: 1 }],
    };
    const reordered: OrderRequest = {
      totalMinor: 10_000,
      items: [{ productId: composed, variantId: null, modifierOptionIds: [decomposed, composed], quantity: 1 }],
    };

    expect(createOrderFingerprint(first)).toBe(createOrderFingerprint(reordered));
    expect(createOrderFingerprint(first)).toContain(JSON.stringify([decomposed, composed]));
  });
});
