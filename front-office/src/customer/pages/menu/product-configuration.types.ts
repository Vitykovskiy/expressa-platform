import type { CartSelectedModifierOption } from "../../shared/model/customer.types";
import type {
  PublicMenuModifierGroup,
  PublicMenuProduct,
} from "../../../shared/api/public-menu.api";

export type ProductConfiguration = {
  product: PublicMenuProduct;
  quantity: number;
  selectedModifierGroups: ProductConfigurationModifierGroup[];
  selectedVariantId: string | null;
};

export type ProductConfigurationModifierGroup = {
  groupId: string;
  optionIds: string[];
};

export type ProductConfigurationTotals = {
  lineTotalMinor: number;
  unitTotalMinor: number;
};

export type ProductConfigurationGroupSelection = {
  group: PublicMenuModifierGroup;
  optionIds: string[];
};

export type ProductConfigurationSelectedOptions = {
  options: CartSelectedModifierOption[];
  valid: boolean;
};
