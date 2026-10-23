import type {
  AdminModifierGroup,
  AdminModifierOption,
} from "../domain/modifier-admin.policy.types";
import type {
  SourceCategoryResult,
  SourceProductResult,
} from "../application/source-menu.types";
import type {
  SourceCategoryResponseDto,
  SourceProductResponseDto,
} from "./source-menu.dto";
import type {
  ModifierGroupResponseDto,
  ModifierOptionResponseDto,
} from "./catalog-modifiers.controller.dto";

export function sourceCategoryResponse(
  value: SourceCategoryResult,
): SourceCategoryResponseDto {
  const { id, name, description, sortOrder, isActive } = value.category;
  return {
    category: { id, name, description, sortOrder, isActive },
    modifierGroupIds: value.modifierGroupIds,
  };
}

export function sourceProductResponse(
  value: SourceProductResult,
): SourceProductResponseDto {
  return {
    id: value.id,
    modifierGroupIds: value.modifierGroupIds,
    categoryId: value.categoryId,
    name: value.name,
    description: value.description,
    price: value.price,
    portionLabel: value.portionLabel,
    sortOrder: value.sortOrder,
    isActive: value.isActive,
    isAvailable: value.isAvailable,
    priceChoices: value.priceChoices.map(
      ({ id, portionLabel, price, sortOrder, isAvailable }) => ({
        id,
        portionLabel,
        price,
        sortOrder,
        isAvailable,
      }),
    ),
  };
}

export function sourceGroupResponse(
  value: AdminModifierGroup,
): ModifierGroupResponseDto {
  const { id, name, selectionType, minSelect, maxSelect, isActive } = value;
  return {
    id,
    name,
    selectionType,
    minSelect,
    maxSelect,
    isActive,
    options: value.options.map(sourceOptionResponse),
  };
}

export function sourceOptionResponse(
  value: AdminModifierOption,
): ModifierOptionResponseDto {
  const { id, groupId, name, priceDelta, sortOrder, isDefault, isAvailable } =
    value;
  return { id, groupId, name, priceDelta, sortOrder, isDefault, isAvailable };
}
