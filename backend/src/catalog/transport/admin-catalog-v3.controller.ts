import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/transport/roles.decorator";
import { RolesGuard } from "../../auth/transport/roles.guard";
import { SessionGuard } from "../../auth/transport/session.guard";
import { GetAdminCatalogUseCase } from "../application/get-admin-catalog.use-case";
import { AdminCatalogV3Dto } from "./admin-catalog-v3.dto";

@ApiTags("catalog-v3")
@Controller("api/v3/backoffice/catalog")
@UseGuards(SessionGuard, RolesGuard)
@Roles("Administrator")
@ApiBearerAuth()
export class AdminCatalogV3Controller {
  constructor(private readonly catalog: GetAdminCatalogUseCase) {}

  @Get()
  @ApiResponse({ status: 200, type: AdminCatalogV3Dto })
  async get(): Promise<AdminCatalogV3Dto> {
    const value = await this.catalog.executeV3();
    return {
      categories: value.categories.map(
        ({ id, name, description, sortOrder, isActive }) => ({
          id,
          name,
          description,
          sortOrder,
          isActive,
        }),
      ),
      products: value.products.map(
        ({
          id,
          categoryId,
          name,
          description,
          price,
          portionLabel,
          sortOrder,
          isActive,
          isAvailable,
        }) => ({
          id,
          categoryId,
          name,
          description,
          price,
          portionLabel,
          sortOrder,
          isActive,
          isAvailable,
          priceChoices: value.priceChoices
            .filter((choice) => choice.productId === id)
            .map(
              ({
                id: choiceId,
                portionLabel: choiceLabel,
                price: choicePrice,
                sortOrder: choiceSortOrder,
                isAvailable: choiceAvailable,
              }) => ({
                id: choiceId,
                portionLabel: choiceLabel,
                price: choicePrice,
                sortOrder: choiceSortOrder,
                isAvailable: choiceAvailable,
              }),
            ),
        }),
      ),
      modifierGroups: value.modifierGroups.map(
        ({ id, name, selectionType, minSelect, maxSelect, isActive }) => ({
          id,
          name,
          selectionType,
          minSelect,
          maxSelect,
          isActive,
        }),
      ),
      modifierOptions: value.modifierOptions.map(
        ({
          id,
          groupId,
          name,
          priceDelta,
          sortOrder,
          isDefault,
          isAvailable,
        }) => ({
          id,
          groupId,
          name,
          priceDelta,
          sortOrder,
          isDefault,
          isAvailable,
        }),
      ),
      categoryModifierGroups: value.categoryModifierGroups.map(
        ({ categoryId, groupId, sortOrder }) => ({
          categoryId,
          groupId,
          sortOrder,
        }),
      ),
    };
  }
}
