import { assertFullProductReorder, assertProductDetails, ProductAdminError } from './product-admin.policy';

const variant = { size: 'M' as const, priceMinor: 32000, sortOrder: 0, isAvailable: true };
const drink = { categoryId: 'category', type: 'DRINK' as const, name: 'Капучино', description: '', priceMinor: null, sortOrder: 0, isActive: true, isAvailable: true, variants: [variant] };
describe('product admin policy', () => {
  it('требует доступный размер для публикуемого напитка', () => expect(() => assertProductDetails({ ...drink, variants: [{ ...variant, isAvailable: false }] })).toThrow(ProductAdminError));
  it('не допускает цену или размеры вне типа товара', () => { expect(() => assertProductDetails({ ...drink, type: 'OTHER', priceMinor: null })).toThrow('PRODUCT_INVALID'); expect(() => assertProductDetails({ ...drink, type: 'OTHER', priceMinor: 0, variants: [] })).not.toThrow(); });
  it('не допускает повторяющиеся размеры', () => expect(() => assertProductDetails({ ...drink, variants: [variant, { ...variant, sortOrder: 1 }] })).toThrow('PRODUCT_INVALID'));
  it('не допускает повторяющиеся позиции размеров и активный напиток без доступного размера', () => {
    expect(() => assertProductDetails({ ...drink, variants: [{ ...variant, size: 'S' }, { ...variant, size: 'M' }] })).toThrow('PRODUCT_INVALID');
    expect(() => assertProductDetails({ ...drink, isAvailable: false, variants: [{ ...variant, isAvailable: false }] })).toThrow('PRODUCT_INVALID');
  });
  it('требует полный уникальный набор товаров одной категории для reorder', () => {
    const products = [
      { id: 'coffee', ...drink, archivedAt: null, variants: [] },
      { id: 'tea', ...drink, name: 'Чай', sortOrder: 1, archivedAt: null, variants: [] },
      { id: 'other-category', ...drink, categoryId: 'other', sortOrder: 0, archivedAt: null, variants: [] },
    ];
    expect(() => assertFullProductReorder(products, 'category', ['coffee'])).toThrow('PRODUCT_REORDER_INVALID');
    expect(() => assertFullProductReorder(products, 'category', ['coffee', 'coffee'])).toThrow('PRODUCT_REORDER_INVALID');
    expect(() => assertFullProductReorder(products, 'category', ['coffee', 'foreign'])).toThrow('PRODUCT_REORDER_INVALID');
    expect(() => assertFullProductReorder(products, 'category', ['tea', 'coffee'])).not.toThrow();
  });
});
