import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from '../platform/database/database.service';
import { GetAdminCatalogUseCase } from './application/get-admin-catalog.use-case';
import { GetPublicMenuUseCase } from './application/get-public-menu.use-case';
import { ManageCategoriesUseCase } from './application/manage-categories.use-case';
import { ManageCategoryModifiersUseCase } from './application/manage-category-modifiers.use-case';
import { ManageModifiersUseCase } from './application/manage-modifiers.use-case';
import { ManageProductsUseCase } from './application/manage-products.use-case';
import { ManageAvailabilityUseCase } from './application/manage-availability.use-case';
import { ManageServiceIntakeUseCase } from './application/manage-service-intake.use-case';
import { CatalogModule } from './catalog.module';
import { AdminCatalogController } from './transport/admin-catalog.controller';
import { CatalogCategoriesController } from './transport/catalog-categories.controller';
import { CatalogCategoryModifiersController } from './transport/catalog-category-modifiers.controller';
import { CatalogModifiersController } from './transport/catalog-modifiers.controller';
import { CatalogProductsController } from './transport/catalog-products.controller';
import { PublicMenuController } from './transport/public-menu.controller';
import { BackofficeAvailabilityController } from './transport/backoffice-availability.controller';

describe('CatalogModule', () => {
  it('связывает публичное чтение и административные сценарии каталога', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [() => ({
            AUTH_ACCESS_TOKEN_SECRET: 'access-token-secret',
            AUTH_DEVELOPMENT_OTP: '123456',
            AUTH_OTP_PEPPER: 'otp-pepper',
            CORS_ORIGINS: 'http://localhost:5173',
            NODE_ENV: 'local',
          })],
        }),
        CatalogModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue({ connectionPool: {} })
      .compile();

    expect(module.get(PublicMenuController)).toBeInstanceOf(PublicMenuController);
    expect(module.get(AdminCatalogController)).toBeInstanceOf(AdminCatalogController);
    expect(module.get(CatalogCategoriesController)).toBeInstanceOf(CatalogCategoriesController);
    expect(module.get(CatalogProductsController)).toBeInstanceOf(CatalogProductsController);
    expect(module.get(CatalogModifiersController)).toBeInstanceOf(CatalogModifiersController);
    expect(module.get(CatalogCategoryModifiersController)).toBeInstanceOf(CatalogCategoryModifiersController);
    expect(module.get(BackofficeAvailabilityController)).toBeInstanceOf(BackofficeAvailabilityController);
    expect(module.get(GetPublicMenuUseCase)).toBeInstanceOf(GetPublicMenuUseCase);
    expect(module.get(GetAdminCatalogUseCase)).toBeInstanceOf(GetAdminCatalogUseCase);
    expect(module.get(ManageCategoriesUseCase)).toBeInstanceOf(ManageCategoriesUseCase);
    expect(module.get(ManageProductsUseCase)).toBeInstanceOf(ManageProductsUseCase);
    expect(module.get(ManageModifiersUseCase)).toBeInstanceOf(ManageModifiersUseCase);
    expect(module.get(ManageCategoryModifiersUseCase)).toBeInstanceOf(ManageCategoryModifiersUseCase);
    expect(module.get(ManageAvailabilityUseCase)).toBeInstanceOf(ManageAvailabilityUseCase);
    expect(module.get(ManageServiceIntakeUseCase)).toBeInstanceOf(ManageServiceIntakeUseCase);
  });
});
