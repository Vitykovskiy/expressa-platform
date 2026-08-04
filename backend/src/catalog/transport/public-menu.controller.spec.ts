import { PATH_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GetPublicMenuUseCase } from '../application/get-public-menu.use-case';
import type { PublicMenu } from '../domain/catalog.types';
import { publicMenuControllerPath } from './public-menu.controller.constants';
import { PublicMenuController } from './public-menu.controller';

const menu: PublicMenu = {
  acceptsNewOrders: true,
  categories: [
    {
      id: 'category-id',
      name: 'Кофе',
      description: 'Напитки',
      products: [
        {
          id: 'product-id',
          type: 'DRINK',
          name: 'Капучино',
          description: 'Кофе с молоком',
          priceMinor: null,
          isAvailable: true,
          variants: [{ id: 'variant-id', size: 'M', priceMinor: 32000, isAvailable: true }],
          modifierGroups: [
            {
              id: 'group-id',
              name: 'Молоко',
              selectionType: 'single',
              minSelect: 1,
              maxSelect: 1,
              options: [{ id: 'option-id', name: 'Обычное', priceDeltaMinor: 0, isDefault: true, isAvailable: true }],
            },
          ],
        },
      ],
    },
  ],
};

describe('PublicMenuController', () => {
  it('возвращает точный публичный агрегат без transport-правил', async () => {
    const getPublicMenu = { execute: jest.fn().mockResolvedValue(menu) };
    const controller = new PublicMenuController(getPublicMenu as unknown as GetPublicMenuUseCase);

    await expect(controller.getMenu()).resolves.toEqual(menu);
    expect(getPublicMenu.execute).toHaveBeenCalledTimes(1);
  });

  it('регистрирует публичный GET /public/menu', () => {
    const prototype = PublicMenuController.prototype;

    expect(Reflect.getMetadata(PATH_METADATA, PublicMenuController)).toBe(publicMenuControllerPath);
    expect(Reflect.getMetadata(PATH_METADATA, prototype.getMenu)).toBe('/');
  });

  it('публикует minor-цены и границы выбора как int32', async () => {
    const module = await Test.createTestingModule({
      controllers: [PublicMenuController],
      providers: [{ provide: GetPublicMenuUseCase, useValue: { execute: jest.fn() } }],
    }).compile();
    const app = module.createNestApplication();

    try {
      const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());

      expect(document.components?.schemas?.PublicMenuProductDto).toMatchObject({
        properties: { priceMinor: { format: 'int32', nullable: true, type: 'integer' } },
      });
      expect(document.components?.schemas?.PublicMenuVariantDto).toMatchObject({
        properties: { priceMinor: { format: 'int32', type: 'integer' } },
      });
      expect(document.components?.schemas?.PublicMenuOptionDto).toMatchObject({
        properties: { priceDeltaMinor: { format: 'int32', type: 'integer' } },
      });
      expect(document.components?.schemas?.PublicMenuModifierGroupDto).toMatchObject({
        properties: {
          minSelect: { format: 'int32', type: 'integer' },
          maxSelect: { format: 'int32', type: 'integer' },
        },
      });
    } finally {
      await app.close();
    }
  });
});
