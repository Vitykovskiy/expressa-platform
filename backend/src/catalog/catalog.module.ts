import { Module } from "@nestjs/common";
import type { Pool } from "pg";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../platform/database/database.module";
import { DatabaseService } from "../platform/database/database.service";
import { PostgresAdminCatalogRepository } from "./adapters/postgres-admin-catalog.repository";
import { PostgresCatalogCommandRunner } from "./adapters/postgres-catalog-command.runner";
import { PostgresCategoriesRepository } from "./adapters/postgres-categories.repository";
import { PostgresCategoryModifiersRepository } from "./adapters/postgres-category-modifiers.repository";
import { PostgresModifiersRepository } from "./adapters/postgres-modifiers.repository";
import { PostgresProductsRepository } from "./adapters/postgres-products.repository";
import { PostgresPublicMenuRepository } from "./adapters/postgres-public-menu.repository";
import { GetAdminCatalogUseCase } from "./application/get-admin-catalog.use-case";
import { GetPublicMenuUseCase } from "./application/get-public-menu.use-case";
import { ManageCategoriesUseCase } from "./application/manage-categories.use-case";
import { ManageCategoryModifiersUseCase } from "./application/manage-category-modifiers.use-case";
import { ManageModifiersUseCase } from "./application/manage-modifiers.use-case";
import { ManageProductsUseCase } from "./application/manage-products.use-case";
import { ManageV3ProductsUseCase } from "./application/manage-products.use-case";
import { ManageAvailabilityUseCase } from "./application/manage-availability.use-case";
import { ManageServiceIntakeUseCase } from "./application/manage-service-intake.use-case";
import type {
  AdminCatalogRepository,
  AvailabilityRepository,
} from "./application/admin-catalog.repository.types";
import type { CategoriesUnitOfWork } from "./application/categories.repository.types";
import type { CategoryModifiersUnitOfWork } from "./application/category-modifiers.repository.types";
import type { ModifiersUnitOfWork } from "./application/modifiers.repository.types";
import type {
  ProductsUnitOfWork,
  V3ProductsUnitOfWork,
} from "./application/products.repository.types";
import type { PublicMenuRepository } from "./application/public-menu.repository.types";
import {
  adminCatalogRepositoryPort,
  categoriesUnitOfWorkPort,
  categoryModifiersUnitOfWorkPort,
  modifiersUnitOfWorkPort,
  productsUnitOfWorkPort,
  publicMenuRepositoryPort,
} from "./catalog.module.constants";
import { AdminCatalogController } from "./transport/admin-catalog.controller";
import { AdminCatalogV3Controller } from "./transport/admin-catalog-v3.controller";
import { CatalogCategoriesController } from "./transport/catalog-categories.controller";
import { CatalogCategoryModifiersController } from "./transport/catalog-category-modifiers.controller";
import { CatalogModifiersController } from "./transport/catalog-modifiers.controller";
import { CatalogProductsController } from "./transport/catalog-products.controller";
import { CatalogProductsV3Controller } from "./transport/catalog-products-v3.controller";
import { PublicMenuController } from "./transport/public-menu.controller";
import { PublicMenuV3Controller } from "./transport/public-menu-v3.controller";
import { BackofficeAvailabilityController } from "./transport/backoffice-availability.controller";
import { BackofficeAvailabilityV3Controller } from "./transport/backoffice-availability-v3.controller";

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [
    PublicMenuController,
    PublicMenuV3Controller,
    AdminCatalogController,
    AdminCatalogV3Controller,
    CatalogCategoriesController,
    CatalogProductsController,
    CatalogProductsV3Controller,
    CatalogModifiersController,
    CatalogCategoryModifiersController,
    BackofficeAvailabilityController,
    BackofficeAvailabilityV3Controller,
  ],
  providers: [
    {
      provide: PostgresCatalogCommandRunner,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new PostgresCatalogCommandRunner(createPoolProxy(database)),
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
      useFactory: (repository: PublicMenuRepository) =>
        new GetPublicMenuUseCase(repository),
    },
    {
      provide: adminCatalogRepositoryPort,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new PostgresAdminCatalogRepository(createPoolProxy(database)),
    },
    {
      provide: GetAdminCatalogUseCase,
      inject: [adminCatalogRepositoryPort],
      useFactory: (repository: AdminCatalogRepository) =>
        new GetAdminCatalogUseCase(repository),
    },
    {
      provide: ManageAvailabilityUseCase,
      inject: [adminCatalogRepositoryPort],
      useFactory: (repository: AvailabilityRepository) =>
        new ManageAvailabilityUseCase(repository),
    },
    {
      provide: ManageServiceIntakeUseCase,
      inject: [adminCatalogRepositoryPort],
      useFactory: (repository: AvailabilityRepository) =>
        new ManageServiceIntakeUseCase(repository),
    },
    {
      provide: categoriesUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) =>
        new PostgresCategoriesRepository(runner),
    },
    {
      provide: productsUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) =>
        new PostgresProductsRepository(runner),
    },
    {
      provide: modifiersUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) =>
        new PostgresModifiersRepository(runner),
    },
    {
      provide: categoryModifiersUnitOfWorkPort,
      inject: [PostgresCatalogCommandRunner],
      useFactory: (runner: PostgresCatalogCommandRunner) =>
        new PostgresCategoryModifiersRepository(runner),
    },
    {
      provide: ManageCategoriesUseCase,
      inject: [categoriesUnitOfWorkPort],
      useFactory: (unitOfWork: CategoriesUnitOfWork) =>
        new ManageCategoriesUseCase(unitOfWork),
    },
    {
      provide: ManageProductsUseCase,
      inject: [productsUnitOfWorkPort],
      useFactory: (unitOfWork: ProductsUnitOfWork) =>
        new ManageProductsUseCase(unitOfWork),
    },
    {
      provide: ManageV3ProductsUseCase,
      inject: [productsUnitOfWorkPort],
      useFactory: (unitOfWork: ProductsUnitOfWork & V3ProductsUnitOfWork) =>
        new ManageV3ProductsUseCase(unitOfWork),
    },
    {
      provide: ManageModifiersUseCase,
      inject: [modifiersUnitOfWorkPort],
      useFactory: (unitOfWork: ModifiersUnitOfWork) =>
        new ManageModifiersUseCase(unitOfWork),
    },
    {
      provide: ManageCategoryModifiersUseCase,
      inject: [categoryModifiersUnitOfWorkPort],
      useFactory: (unitOfWork: CategoryModifiersUnitOfWork) =>
        new ManageCategoryModifiersUseCase(unitOfWork),
    },
  ],
})
export class CatalogModule {}

function createPoolProxy(database: DatabaseService): Pool {
  return new Proxy({} as Pool, {
    get: (_target, property) => {
      const value = database.connectionPool[property as keyof Pool];
      return typeof value === "function"
        ? value.bind(database.connectionPool)
        : value;
    },
  });
}
