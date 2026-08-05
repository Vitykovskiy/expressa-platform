import { Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../platform/database/database.module';
import { DatabaseService } from '../platform/database/database.service';
import { PostgresAdminCatalogRepository } from './adapters/postgres-admin-catalog.repository';
import { PostgresCatalogCommandRunner } from './adapters/postgres-catalog-command.runner';
import { PostgresCategoriesRepository } from './adapters/postgres-categories.repository';
import { PostgresCategoryModifiersRepository } from './adapters/postgres-category-modifiers.repository';
import { PostgresModifiersRepository } from './adapters/postgres-modifiers.repository';
import { PostgresProductsRepository } from './adapters/postgres-products.repository';
import { PostgresPublicMenuRepository } from './adapters/postgres-public-menu.repository';
import { GetAdminCatalogUseCase } from './application/get-admin-catalog.use-case';
import { GetPublicMenuUseCase } from './application/get-public-menu.use-case';
import { ManageCategoriesUseCase } from './application/manage-categories.use-case';
import { ManageCategoryModifiersUseCase } from './application/manage-category-modifiers.use-case';
import { ManageModifiersUseCase } from './application/manage-modifiers.use-case';
import { ManageProductsUseCase } from './application/manage-products.use-case';
import type { AdminCatalogRepository } from './application/admin-catalog.repository.types';
import type { CategoriesUnitOfWork } from './application/categories.repository.types';
import type { CategoryModifiersUnitOfWork } from './application/category-modifiers.repository.types';
import type { ModifiersUnitOfWork } from './application/modifiers.repository.types';
import type { ProductsUnitOfWork } from './application/products.repository.types';
import type { PublicMenuRepository } from './application/public-menu.repository.types';
import {
  adminCatalogRepositoryPort,
  categoriesUnitOfWorkPort,
  categoryModifiersUnitOfWorkPort,
  modifiersUnitOfWorkPort,
  productsUnitOfWorkPort,
  publicMenuRepositoryPort,
} from './catalog.module.constants';
import { AdminCatalogController } from './transport/admin-catalog.controller';
import { CatalogCategoriesController } from './transport/catalog-categories.controller';
import { CatalogCategoryModifiersController } from './transport/catalog-category-modifiers.controller';
import { CatalogModifiersController } from './transport/catalog-modifiers.controller';
import { CatalogProductsController } from './transport/catalog-products.controller';
import { PublicMenuController } from './transport/public-menu.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicMenuController, AdminCatalogController, CatalogCategoriesController, CatalogProductsController, CatalogModifiersController, CatalogCategoryModifiersController],
  providers: [
    {
      provide: PostgresCatalogCommandRunner,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresCatalogCommandRunner(createPoolProxy(database)),
    },
    {
      provide: publicMenuRepositoryPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new PostgresPublicMenuRepository(createPoolProxy(database)),
    },
    {
      provide: GetPublicMenuUseCase,
      inject: [publicMenuRepositoryPort],
      useFactory: (repository: PublicMenuRepository) => new GetPublicMenuUseCase(repository),
    },
    {
      provide: adminCatalogRepositoryPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new PostgresAdminCatalogRepository(createPoolProxy(database)),
    },
    {
      provide: GetAdminCatalogUseCase,
      inject: [adminCatalogRepositoryPort],
      useFactory: (repository: AdminCatalogRepository) => new GetAdminCatalogUseCase(repository),
    },
    {
      provide: categoriesUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) => new PostgresCategoriesRepository(runner),
    },
    {
      provide: productsUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) => new PostgresProductsRepository(runner),
    },
    {
      provide: modifiersUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) => new PostgresModifiersRepository(runner),
    },
    {
      provide: categoryModifiersUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) => new PostgresCategoryModifiersRepository(runner),
    },
    {
      provide: ManageCategoriesUseCase,
      inject: [categoriesUnitOfWorkPort],
      useFactory: (unitOfWork: CategoriesUnitOfWork) => new ManageCategoriesUseCase(unitOfWork),
    },
    {
      provide: ManageProductsUseCase,
      inject: [productsUnitOfWorkPort],
      useFactory: (unitOfWork: ProductsUnitOfWork) => new ManageProductsUseCase(unitOfWork),
    },
    {
      provide: ManageModifiersUseCase,
      inject: [modifiersUnitOfWorkPort],
      useFactory: (unitOfWork: ModifiersUnitOfWork) => new ManageModifiersUseCase(unitOfWork),
    },
    {
      provide: ManageCategoryModifiersUseCase,
      inject: [categoryModifiersUnitOfWorkPort],
      useFactory: (unitOfWork: CategoryModifiersUnitOfWork) => new ManageCategoryModifiersUseCase(unitOfWork),
    },
  ],
})
export class CatalogModule {}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, {
    get: (_target, property) => {
      const value = database.connectionPool[property as keyof Pool];
      return typeof value === 'function' ? value.bind(database.connectionPool) : value;
    },
  });
}
