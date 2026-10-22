export interface CatalogCategoryCreateDto {
  readonly name: string;
  readonly optionGroupId: string | null;
}

export interface CatalogCategoryUpdateDto {
  readonly name: string;
  readonly optionGroupId?: string | null;
}

export interface CatalogGroupWriteDto {
  readonly name: string;
}

export interface CatalogOptionWriteDto {
  readonly name: string;
  readonly priceDelta: number;
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
