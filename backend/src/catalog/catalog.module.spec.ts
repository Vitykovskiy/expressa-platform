import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { DatabaseService } from "../platform/database/database.service";
import { GetAdminCatalogUseCase } from "./application/get-admin-catalog.use-case";
import { GetPublicMenuUseCase } from "./application/get-public-menu.use-case";
import { ManageAvailabilityUseCase } from "./application/manage-availability.use-case";
import { ManageCategoriesUseCase } from "./application/manage-categories.use-case";
import { ManageCategoryModifiersUseCase } from "./application/manage-category-modifiers.use-case";
import { ManageModifiersUseCase } from "./application/manage-modifiers.use-case";
import { ManageV3ProductsUseCase } from "./application/manage-products.use-case";
import { ManageServiceIntakeUseCase } from "./application/manage-service-intake.use-case";
import { CatalogModule } from "./catalog.module";
import { AdminCatalogV3Controller } from "./transport/admin-catalog-v3.controller";
import { BackofficeAvailabilityV3Controller } from "./transport/backoffice-availability-v3.controller";
import { BackofficeAvailabilityController } from "./transport/backoffice-availability.controller";
import { CatalogCategoriesController } from "./transport/catalog-categories.controller";
import { CatalogCategoryModifiersController } from "./transport/catalog-category-modifiers.controller";
import { CatalogModifiersController } from "./transport/catalog-modifiers.controller";
import { CatalogProductsV3Controller } from "./transport/catalog-products-v3.controller";
import { PublicMenuV3Controller } from "./transport/public-menu-v3.controller";

describe("CatalogModule", () => {
  it("wires current v3 catalog controllers and use cases", async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              AUTH_ACCESS_TOKEN_SECRET: "access-token-secret",
              AUTH_DEVELOPMENT_OTP: "123456",
              AUTH_OTP_PEPPER: "otp-pepper",
              CORS_ORIGINS: "http://localhost:5173",
              NODE_ENV: "local",
            }),
          ],
        }),
        CatalogModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue({ connectionPool: {} })
      .compile();

    for (const controller of [
      PublicMenuV3Controller,
      AdminCatalogV3Controller,
      CatalogCategoriesController,
      CatalogProductsV3Controller,
      CatalogModifiersController,
      CatalogCategoryModifiersController,
      BackofficeAvailabilityController,
      BackofficeAvailabilityV3Controller,
    ])
      expect(module.get(controller)).toBeInstanceOf(controller);

    for (const useCase of [
      GetPublicMenuUseCase,
      GetAdminCatalogUseCase,
      ManageCategoriesUseCase,
      ManageV3ProductsUseCase,
      ManageModifiersUseCase,
      ManageCategoryModifiersUseCase,
      ManageAvailabilityUseCase,
      ManageServiceIntakeUseCase,
    ])
      expect(module.get(useCase)).toBeInstanceOf(useCase);
  });
});
