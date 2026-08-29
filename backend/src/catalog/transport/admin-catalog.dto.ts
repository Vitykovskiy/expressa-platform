import { ApiProperty } from '@nestjs/swagger';
import { modifierSelectionTypes, productSizes, productTypes } from '../domain/catalog.constants';
import type {
  AdminCatalogModifierSelectionType,
  AdminCatalogProductSize,
  AdminCatalogProductType,
} from './admin-catalog.dto.types';

export class AdminCatalogCategoryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: 'int32', type: 'integer' }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
}

export class AdminCatalogProductDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty({ enum: productTypes }) type!: AdminCatalogProductType;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: 'int32', minimum: 0, nullable: true, type: 'integer' }) price!: number | null;
  @ApiProperty({ format: 'int32', type: 'integer' }) sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isAvailable!: boolean;
}

export class AdminCatalogProductVariantDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty({ enum: productSizes }) size!: AdminCatalogProductSize;
  @ApiProperty({ format: 'int32', minimum: 0, type: 'integer' }) price!: number;
  @ApiProperty({ format: 'int32', type: 'integer' }) sortOrder!: number;
  @ApiProperty() isAvailable!: boolean;
}

export class AdminCatalogModifierGroupDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: modifierSelectionTypes }) selectionType!: AdminCatalogModifierSelectionType;
  @ApiProperty({ format: 'int32', type: 'integer' }) minSelect!: number;
  @ApiProperty({ format: 'int32', type: 'integer' }) maxSelect!: number;
  @ApiProperty() isActive!: boolean;
}

export class AdminCatalogModifierOptionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) groupId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'int32', minimum: 0, type: 'integer' }) priceDelta!: number;
  @ApiProperty({ format: 'int32', type: 'integer' }) sortOrder!: number;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() isAvailable!: boolean;
}

export class AdminCatalogCategoryModifierGroupDto {
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty({ format: 'uuid' }) groupId!: string;
  @ApiProperty({ format: 'int32', type: 'integer' }) sortOrder!: number;
}

export class AdminCatalogDto {
  @ApiProperty({ isArray: true, type: () => AdminCatalogCategoryDto }) categories!: AdminCatalogCategoryDto[];
  @ApiProperty({ isArray: true, type: () => AdminCatalogProductDto }) products!: AdminCatalogProductDto[];
  @ApiProperty({ isArray: true, type: () => AdminCatalogProductVariantDto }) productVariants!: AdminCatalogProductVariantDto[];
  @ApiProperty({ isArray: true, type: () => AdminCatalogModifierGroupDto }) modifierGroups!: AdminCatalogModifierGroupDto[];
  @ApiProperty({ isArray: true, type: () => AdminCatalogModifierOptionDto }) modifierOptions!: AdminCatalogModifierOptionDto[];
  @ApiProperty({ isArray: true, type: () => AdminCatalogCategoryModifierGroupDto }) categoryModifierGroups!: AdminCatalogCategoryModifierGroupDto[];
}
