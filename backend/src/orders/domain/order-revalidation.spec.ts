import {
  MenuItemUnavailableError,
  OrderIntakeClosedError,
  OrderTotalChangedError,
  OrderValidationError,
} from './order.errors';
import { revalidateOrder } from './order-revalidation';
import type { OrderCatalog, OrderRequest } from './order.types';

const request: OrderRequest = {
  totalMinor: 82_000,
  items: [{ productId: 'coffee', variantId: 'medium', modifierOptionIds: ['oat'], quantity: 2 }],
};

function createCatalog(): OrderCatalog {
  return {
    acceptsNewOrders: true,
    products: [{
      id: 'coffee', type: 'DRINK', name: 'Капучино', priceMinor: null, isAvailable: true,
      variants: [{ id: 'medium', size: 'M', priceMinor: 32_000, isAvailable: true }],
      modifierGroups: [{
        id: 'milk', selectionType: 'single', minSelect: 1, maxSelect: 1,
        options: [{ id: 'oat', name: 'Овсяное', priceDeltaMinor: 9_000, isDefault: false, isAvailable: true }, { id: 'regular', name: 'Обычное', priceDeltaMinor: 0, isDefault: true, isAvailable: true }],
      }],
    }],
  };
}

describe('revalidateOrder', () => {
  it('создаёт независимый неизменяемый снимок по серверной цене', () => {
    const catalog = createCatalog();
    const result = revalidateOrder(request, catalog);

    catalog.products[0]!.name = 'Изменённый напиток';
    catalog.products[0]!.variants[0]!.priceMinor = 1;

    expect(result).toEqual({
      totalMinor: 82_000,
      items: [{
        productId: 'coffee', variantId: 'medium', productName: 'Капучино', size: 'M', quantity: 2,
        unitTotalMinor: 41_000, lineTotalMinor: 82_000,
        modifiers: [{ modifierOptionId: 'oat', modifierName: 'Овсяное', priceDeltaMinor: 9_000 }],
      }],
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.items)).toBe(true);
    expect(Object.isFrozen(result.items[0]!)).toBe(true);
    expect(Object.isFrozen(result.items[0]!.modifiers)).toBe(true);
  });

  it('соблюдает приоритет: приём, валидация, доступность, сумма', () => {
    const closed = createCatalog();
    closed.acceptsNewOrders = false;
    expect(() => revalidateOrder({ ...request, items: [] }, closed)).toThrow(OrderIntakeClosedError);

    const unavailable = createCatalog();
    unavailable.products[0]!.isAvailable = false;
    expect(() => revalidateOrder({ ...request, items: [] }, unavailable)).toThrow(OrderValidationError);

    const changed = createCatalog();
    changed.products[0]!.isAvailable = false;
    expect(() => revalidateOrder({ ...request, totalMinor: 1 }, changed)).toThrow(MenuItemUnavailableError);

    expect(() => revalidateOrder({ ...request, totalMinor: 1 }, createCatalog())).toThrow(OrderTotalChangedError);
  });

  it('отклоняет неверную конфигурацию и недоступный выбранный вариант', () => {
    expect(() => revalidateOrder({ ...request, items: [{ ...request.items[0]!, variantId: null }] }, createCatalog())).toThrow(OrderValidationError);
    expect(() => revalidateOrder({ ...request, items: [{ ...request.items[0]!, modifierOptionIds: [] }] }, createCatalog())).toThrow(OrderValidationError);
    expect(() => revalidateOrder({ ...request, items: [{ ...request.items[0]!, quantity: 21 }] }, createCatalog())).toThrow(OrderValidationError);
    expect(() => revalidateOrder({ ...request, items: [request.items[0]!, { ...request.items[0]! }] }, createCatalog())).toThrow(OrderValidationError);

    const catalog = createCatalog();
    catalog.products[0]!.variants[0]!.isAvailable = false;
    expect(() => revalidateOrder(request, catalog)).toThrow(MenuItemUnavailableError);
  });

  it('отклоняет неоднозначные данные каталога до выбора первой позиции', () => {
    const catalog = createCatalog();
    const duplicateProduct: OrderCatalog = { ...catalog, products: [...catalog.products, { ...catalog.products[0]! }] };
    expect(() => revalidateOrder(request, duplicateProduct)).toThrow(OrderValidationError);

    const duplicateVariantSize: OrderCatalog = {
      ...catalog,
      products: [{
        ...catalog.products[0]!,
        variants: [...catalog.products[0]!.variants, { ...catalog.products[0]!.variants[0]!, id: 'other-medium' }],
      }],
    };
    expect(() => revalidateOrder(request, duplicateVariantSize)).toThrow(OrderValidationError);

    const duplicateOption: OrderCatalog = {
      ...catalog,
      products: [{
        ...catalog.products[0]!,
        modifierGroups: [{
          ...catalog.products[0]!.modifierGroups[0]!,
          options: [...catalog.products[0]!.modifierGroups[0]!.options, { ...catalog.products[0]!.modifierGroups[0]!.options[0]! }],
        }],
      }],
    };
    expect(() => revalidateOrder(request, duplicateOption)).toThrow(OrderValidationError);
  });

  it('проверяет товары без вариантов и неизвестные позиции', () => {
    const catalog: OrderCatalog = {
      acceptsNewOrders: true,
      products: [{
      id: 'cake', type: 'OTHER', name: 'Пирог', priceMinor: 120, isAvailable: true,
      variants: [], modifierGroups: [],
      }],
    };
    const otherRequest: OrderRequest = {
      totalMinor: 240,
      items: [{ productId: 'cake', variantId: null, modifierOptionIds: [], quantity: 2 }],
    };
    expect(revalidateOrder(otherRequest, catalog).items[0]).toMatchObject({
      variantId: null, size: null, unitTotalMinor: 120, lineTotalMinor: 240, modifiers: [],
    });
    expect(() => revalidateOrder({ ...otherRequest, items: [{ ...otherRequest.items[0]!, variantId: 'x' }] }, catalog))
      .toThrow(OrderValidationError);
    expect(() => revalidateOrder({ ...otherRequest, items: [{ ...otherRequest.items[0]!, productId: 'missing' }] }, catalog))
      .toThrow(OrderValidationError);
  });

  it('отклоняет ошибки конфигурации групп, опций и выбора модификаторов', () => {
    const invalidGroup = createCatalog();
    invalidGroup.products[0]!.modifierGroups[0]!.maxSelect = 2;
    expect(() => revalidateOrder(request, invalidGroup)).toThrow(OrderValidationError);

    const invalidOption = createCatalog();
    invalidOption.products[0]!.modifierGroups[0]!.options[0]!.name = ' ';
    expect(() => revalidateOrder(request, invalidOption)).toThrow(OrderValidationError);

    const unknownOption = createCatalog();
    expect(() => revalidateOrder({ ...request, items: [{ ...request.items[0]!, modifierOptionIds: ['unknown'] }] }, unknownOption))
      .toThrow(OrderValidationError);

    const invalidSelection = createCatalog();
    invalidSelection.products[0]!.modifierGroups[0]!.minSelect = 0;
    invalidSelection.products[0]!.modifierGroups[0]!.maxSelect = 0;
    expect(() => revalidateOrder({ ...request, items: [{ ...request.items[0]!, modifierOptionIds: ['oat'] }] }, invalidSelection))
      .toThrow(OrderValidationError);
  });

  it('отклоняет недоступный модификатор и некорректные цены', () => {
    const unavailable = createCatalog();
    unavailable.products[0]!.modifierGroups[0]!.options[0]!.isAvailable = false;
    expect(() => revalidateOrder(request, unavailable)).toThrow(MenuItemUnavailableError);

    const negative = createCatalog();
    negative.products[0]!.variants[0]!.priceMinor = -1;
    expect(() => revalidateOrder(request, negative)).toThrow(OrderValidationError);

    const nullPrice: OrderCatalog = {
      acceptsNewOrders: true,
      products: [{ id: 'cake', type: 'OTHER', name: 'Пирог', priceMinor: null, isAvailable: true, variants: [], modifierGroups: [] }],
    };
    expect(() => revalidateOrder({ totalMinor: 0, items: [{ productId: 'cake', variantId: null, modifierOptionIds: [], quantity: 1 }] }, nullPrice))
      .toThrow(OrderValidationError);
  });
});
