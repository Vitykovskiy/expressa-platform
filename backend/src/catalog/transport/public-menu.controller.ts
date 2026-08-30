import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetPublicMenuUseCase } from "../application/get-public-menu.use-case";
import type { PublicMenu } from "../domain/catalog.types";
import {
  publicMenuApiTag,
  publicMenuControllerPath,
} from "./public-menu.controller.constants";
import { PublicMenuDto } from "./public-menu.dto";

@ApiTags(publicMenuApiTag)
@Controller(publicMenuControllerPath)
export class PublicMenuController {
  constructor(private readonly getPublicMenu: GetPublicMenuUseCase) {}

  @Get()
  @ApiOperation({ summary: "Получить публичное меню" })
  @ApiResponse({ status: 200, type: PublicMenuDto })
  async getMenu(): Promise<PublicMenuDto> {
    return toPublicMenuDto(await this.getPublicMenu.execute());
  }
}

function toPublicMenuDto(menu: PublicMenu): PublicMenuDto {
  return {
    acceptsNewOrders: menu.acceptsNewOrders,
    categories: menu.categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      products: category.products.map((product) => ({
        id: product.id,
        type: product.type,
        name: product.name,
        description: product.description,
        price: product.price,
        isAvailable: product.isAvailable,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          price: variant.price,
          isAvailable: variant.isAvailable,
        })),
        modifierGroups: product.modifierGroups.map((group) => ({
          id: group.id,
          name: group.name,
          selectionType: group.selectionType,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: option.priceDelta,
            isDefault: option.isDefault,
            isAvailable: option.isAvailable,
          })),
        })),
      })),
    })),
  };
}
