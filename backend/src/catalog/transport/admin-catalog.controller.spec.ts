import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { rolesMetadataKey } from '../../auth/transport/roles.decorator.constants';
import { RolesGuard } from '../../auth/transport/roles.guard';
import { SessionGuard } from '../../auth/transport/session.guard';
import { GetAdminCatalogUseCase } from '../application/get-admin-catalog.use-case';
import { adminCatalogControllerPath } from './admin-catalog.controller.constants';
import { AdminCatalogController } from './admin-catalog.controller';

const swaggerResponsesMetadataKey = 'swagger/apiResponse';

describe('AdminCatalogController', () => {
  it('возвращает точный transport DTO без archivedAt', async () => {
    const catalog = {
      categories: [{ id: 'category', name: 'Кофе', description: 'Напитки', sortOrder: 10, isActive: false, archivedAt: null }],
      products: [{ id: 'product', categoryId: 'category', type: 'DRINK', name: 'Капучино', description: 'Кофе', price: null, sortOrder: 20, isActive: false, isAvailable: false, archivedAt: null }],
      productVariants: [{ id: 'variant', productId: 'product', size: 'M', price: 320, sortOrder: 30, isAvailable: false, archivedAt: null }],
      modifierGroups: [{ id: 'group', name: 'Молоко', selectionType: 'single', minSelect: 0, maxSelect: 1, isActive: false, archivedAt: null }],
      modifierOptions: [{ id: 'option', groupId: 'group', name: 'Овсяное', priceDelta: 50, sortOrder: 40, isDefault: false, isAvailable: false, archivedAt: null }],
      categoryModifierGroups: [{ categoryId: 'category', groupId: 'group', sortOrder: 50 }],
    };
    const getAdminCatalog = { execute: jest.fn().mockResolvedValue(catalog) };
    const controller = new AdminCatalogController(getAdminCatalog as unknown as GetAdminCatalogUseCase);

    await expect(controller.getCatalog()).resolves.toEqual({
      categories: [{ id: 'category', name: 'Кофе', description: 'Напитки', sortOrder: 10, isActive: false }],
      products: [{ id: 'product', categoryId: 'category', type: 'DRINK', name: 'Капучино', description: 'Кофе', price: null, sortOrder: 20, isActive: false, isAvailable: false }],
      productVariants: [{ id: 'variant', productId: 'product', size: 'M', price: 320, sortOrder: 30, isAvailable: false }],
      modifierGroups: [{ id: 'group', name: 'Молоко', selectionType: 'single', minSelect: 0, maxSelect: 1, isActive: false }],
      modifierOptions: [{ id: 'option', groupId: 'group', name: 'Овсяное', priceDelta: 50, sortOrder: 40, isDefault: false, isAvailable: false }],
      categoryModifierGroups: [{ categoryId: 'category', groupId: 'group', sortOrder: 50 }],
    });
    expect(getAdminCatalog.execute).toHaveBeenCalledTimes(1);
  });

  it('регистрирует защищённый GET /backoffice/catalog только для Administrator', () => {
    const prototype = AdminCatalogController.prototype;

    expect(Reflect.getMetadata(PATH_METADATA, AdminCatalogController)).toBe(adminCatalogControllerPath);
    expect(Reflect.getMetadata(PATH_METADATA, prototype.getCatalog)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, prototype.getCatalog)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(GUARDS_METADATA, prototype.getCatalog)).toEqual([SessionGuard, RolesGuard]);
    expect(Reflect.getMetadata(rolesMetadataKey, prototype.getCatalog)).toBe('Administrator');
    expect(responseStatuses(prototype.getCatalog)).toEqual([
      '200',
      '401',
      '403',
      '500',
    ]);
  });
});

function responseStatuses(target: object): string[] {
  return Object.keys(Reflect.getMetadata(swaggerResponsesMetadataKey, target)).sort();
}
