import type { CatalogGroupValues } from "./catalog.types";

export interface CatalogCategoryCreateDto {
  readonly name: string;
  readonly optionGroupIds: readonly string[];
}

export interface CatalogCategoryUpdateDto {
  readonly name: string;
  readonly optionGroupIds?: readonly string[];
}

export interface CatalogGroupWriteDto extends CatalogGroupValues {
  readonly name: string;
}

export interface CatalogProductWriteDto {
  readonly name: string;
  readonly categoryId: string;
  readonly price: number | null;
  readonly priceChoices: readonly {
    readonly id?: string;
    readonly portionLabel: string;
    readonly price: number;
  }[];
}
