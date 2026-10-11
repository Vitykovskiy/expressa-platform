export type AvailabilityKind =
  "product" | "price_choice" | "modifier" | "intake";
export type AvailabilityMode = "products" | "addons";

export interface AvailabilityCategoryDto {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}
export interface AvailabilityProductDto extends AvailabilityCategoryDto {
  categoryId: string;
  price: number | null;
  isAvailable: boolean;
}
export interface AvailabilityChoiceDto {
  id: string;
  productId: string;
  portionLabel: string;
  price: number;
  sortOrder: number;
  isAvailable: boolean;
}
export interface AvailabilityGroupDto {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
}
export interface AvailabilityOptionDto {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  sortOrder: number;
  isDefault: boolean;
  isAvailable: boolean;
}
export interface AvailabilityCategoryLinkDto {
  categoryId: string;
  groupId: string;
  sortOrder: number;
}
export interface AvailabilityProductLinkDto {
  productId: string;
  groupId: string;
  sortOrder: number;
}
export interface Intake {
  acceptsNewOrders: boolean;
  updatedBy: string | null;
  updatedByLabel: string | null;
  updatedAt: string | null;
}
export interface AvailabilityDto {
  categories: AvailabilityCategoryDto[];
  products: AvailabilityProductDto[];
  priceChoices: AvailabilityChoiceDto[];
  modifierGroups: AvailabilityGroupDto[];
  modifierOptions: AvailabilityOptionDto[];
  categoryModifierGroups: AvailabilityCategoryLinkDto[];
  productModifierGroups: AvailabilityProductLinkDto[];
  intake: Intake;
}
export interface AvailabilityTarget {
  kind: Exclude<AvailabilityKind, "intake">;
  id: string;
  label: string;
  isAvailable: boolean;
  price: number | null;
  inactive: boolean;
}
export interface AvailabilityProduct extends AvailabilityTarget {
  choices: AvailabilityTarget[];
}
export interface AvailabilityCategory {
  id: string;
  label: string;
  inactive: boolean;
  products: AvailabilityProduct[];
}
export interface AvailabilityRelation {
  id: string;
  categoryId: string;
  categoryLabel: string;
  label: string;
}
export interface AvailabilityGroup {
  id: string;
  label: string;
  inactive: boolean;
  categoryIds: string[];
  products: AvailabilityRelation[];
  options: AvailabilityTarget[];
}
export interface Availability {
  categories: AvailabilityCategory[];
  groups: AvailabilityGroup[];
  intake: Intake;
}
export interface AvailabilityIntent {
  kind: AvailabilityKind;
  id: string | null;
  requested: boolean;
}
export interface AvailabilityOperation extends AvailabilityIntent {
  label: string;
  previous: boolean;
  status:
    | "sending"
    | "completed"
    | "failed"
    | "absent"
    | "unknown"
    | "reconciling"
    | "reconciled";
  message: string;
}
