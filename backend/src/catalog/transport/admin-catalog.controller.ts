import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiHttpErrorDto } from '../../platform/observability/http-error.dto';
import { Roles } from '../../auth/transport/roles.decorator';
import { RolesGuard } from '../../auth/transport/roles.guard';
import { SessionGuard } from '../../auth/transport/session.guard';
import type { AdminCatalogCandidates } from '../application/admin-catalog.repository.types';
import { GetAdminCatalogUseCase } from '../application/get-admin-catalog.use-case';
import { adminCatalogApiTag, adminCatalogControllerPath } from './admin-catalog.controller.constants';
import {
  AdminCatalogCategoryDto,
  AdminCatalogCategoryModifierGroupDto,
  AdminCatalogDto,
  AdminCatalogModifierGroupDto,
  AdminCatalogModifierOptionDto,
  AdminCatalogProductDto,
  AdminCatalogProductVariantDto,
} from './admin-catalog.dto';

@ApiTags(adminCatalogApiTag)
@Controller(adminCatalogControllerPath)
export class AdminCatalogController {
  constructor(private readonly getAdminCatalog: GetAdminCatalogUseCase) {}

  @Get()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('Administrator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить каталог для управления меню' })
  @ApiResponse({ status: 200, type: AdminCatalogDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ApiHttpErrorDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, type: ApiHttpErrorDto })
  async getCatalog(): Promise<AdminCatalogDto> {
    return toAdminCatalogDto(await this.getAdminCatalog.execute());
  }
}

function toAdminCatalogDto(catalog: AdminCatalogCandidates): AdminCatalogDto {
  return {
    categories: catalog.categories.map(toCategoryDto),
    products: catalog.products.map(toProductDto),
    productVariants: catalog.productVariants.map(toProductVariantDto),
    modifierGroups: catalog.modifierGroups.map(toModifierGroupDto),
    modifierOptions: catalog.modifierOptions.map(toModifierOptionDto),
    categoryModifierGroups: catalog.categoryModifierGroups.map(toCategoryModifierGroupDto),
  };
}

function toCategoryDto(category: AdminCatalogCandidates['categories'][number]): AdminCatalogCategoryDto {
  return { id: category.id, name: category.name, description: category.description, sortOrder: category.sortOrder, isActive: category.isActive };
}

function toProductDto(product: AdminCatalogCandidates['products'][number]): AdminCatalogProductDto {
  return { id: product.id, categoryId: product.categoryId, type: product.type, name: product.name, description: product.description, price: product.price, sortOrder: product.sortOrder, isActive: product.isActive, isAvailable: product.isAvailable };
}

function toProductVariantDto(variant: AdminCatalogCandidates['productVariants'][number]): AdminCatalogProductVariantDto {
  return { id: variant.id, productId: variant.productId, size: variant.size, price: variant.price, sortOrder: variant.sortOrder, isAvailable: variant.isAvailable };
}

function toModifierGroupDto(group: AdminCatalogCandidates['modifierGroups'][number]): AdminCatalogModifierGroupDto {
  return { id: group.id, name: group.name, selectionType: group.selectionType, minSelect: group.minSelect, maxSelect: group.maxSelect, isActive: group.isActive };
}

function toModifierOptionDto(option: AdminCatalogCandidates['modifierOptions'][number]): AdminCatalogModifierOptionDto {
  return { id: option.id, groupId: option.groupId, name: option.name, priceDelta: option.priceDelta, sortOrder: option.sortOrder, isDefault: option.isDefault, isAvailable: option.isAvailable };
}

function toCategoryModifierGroupDto(assignment: AdminCatalogCandidates['categoryModifierGroups'][number]): AdminCatalogCategoryModifierGroupDto {
  return { categoryId: assignment.categoryId, groupId: assignment.groupId, sortOrder: assignment.sortOrder };
}
