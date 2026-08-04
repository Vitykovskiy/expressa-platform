import { ApiProperty } from '@nestjs/swagger';
import {
  modifierSelectionTypes,
  productSizes,
  productTypes,
} from '../domain/catalog.constants';
import type {
  PublicMenuModifierSelectionType,
  PublicMenuProductSize,
  PublicMenuProductType,
} from './public-menu.dto.types';

export class PublicMenuOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'int32', type: 'integer' })
  priceDeltaMinor!: number;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  isAvailable!: boolean;
}

export class PublicMenuModifierGroupDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: modifierSelectionTypes })
  selectionType!: PublicMenuModifierSelectionType;

  @ApiProperty({ format: 'int32', type: 'integer' })
  minSelect!: number;

  @ApiProperty({ format: 'int32', type: 'integer' })
  maxSelect!: number;

  @ApiProperty({ isArray: true, type: () => PublicMenuOptionDto })
  options!: PublicMenuOptionDto[];
}

export class PublicMenuVariantDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: productSizes })
  size!: PublicMenuProductSize;

  @ApiProperty({ format: 'int32', type: 'integer' })
  priceMinor!: number;

  @ApiProperty()
  isAvailable!: boolean;
}

export class PublicMenuProductDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: productTypes })
  type!: PublicMenuProductType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ format: 'int32', nullable: true, type: 'integer' })
  priceMinor!: number | null;

  @ApiProperty()
  isAvailable!: boolean;

  @ApiProperty({ isArray: true, type: () => PublicMenuVariantDto })
  variants!: PublicMenuVariantDto[];

  @ApiProperty({ isArray: true, type: () => PublicMenuModifierGroupDto })
  modifierGroups!: PublicMenuModifierGroupDto[];
}

export class PublicMenuCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ isArray: true, type: () => PublicMenuProductDto })
  products!: PublicMenuProductDto[];
}

export class PublicMenuDto {
  @ApiProperty()
  acceptsNewOrders!: boolean;

  @ApiProperty({ isArray: true, type: () => PublicMenuCategoryDto })
  categories!: PublicMenuCategoryDto[];
}
