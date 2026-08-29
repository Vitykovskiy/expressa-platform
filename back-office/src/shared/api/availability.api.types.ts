export type AvailabilityEntityType = "modifier" | "product" | "variant";

export type AvailabilityItem = {
  id: string;
  isAvailable: boolean;
  label: string;
  sublabel: string;
  type: AvailabilityEntityType;
};

export type AvailabilityGroup = {
  id: string;
  items: readonly AvailabilityItem[];
  name: string;
  sortOrder: number;
};

export type ServiceIntake = {
  acceptsNewOrders: boolean;
  updatedAt: string | null;
  updatedByLabel: string | null;
};

export type ServiceIntakeDto = {
  acceptsNewOrders: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  updatedByLabel: string | null;
};

export type Availability = {
  groups: readonly AvailabilityGroup[];
  intake: ServiceIntake;
};

export type AvailabilityUpdate = {
  id: string;
  isAvailable: boolean;
  type: AvailabilityEntityType;
};

export type AvailabilityApiError = {
  code: string;
  details: unknown;
  message: string;
  requestId: string | null;
  status: number | null;
};

export type AvailabilityCategoryDto = {
  id: string;
  isActive: boolean;
  name: string;
  sortOrder: number;
};

export type AvailabilityProductDto = {
  categoryId: string;
  id: string;
  isActive: boolean;
  isAvailable: boolean;
  name: string;
  sortOrder: number;
};

export type AvailabilityVariantDto = {
  id: string;
  isAvailable: boolean;
  productId: string;
  size: "L" | "M" | "S";
  sortOrder: number;
};

export type AvailabilityModifierGroupDto = {
  id: string;
  isActive: boolean;
  name: string;
};

export type AvailabilityModifierDto = {
  groupId: string;
  id: string;
  isAvailable: boolean;
  name: string;
  sortOrder: number;
};

export type AvailabilityCategoryModifierGroupDto = {
  categoryId: string;
  groupId: string;
  sortOrder: number;
};

export type AvailabilityResponseDto = {
  categories: readonly AvailabilityCategoryDto[];
  categoryModifierGroups: readonly AvailabilityCategoryModifierGroupDto[];
  intake: ServiceIntakeDto;
  modifierGroups: readonly AvailabilityModifierGroupDto[];
  modifierOptions: readonly AvailabilityModifierDto[];
  productVariants: readonly AvailabilityVariantDto[];
  products: readonly AvailabilityProductDto[];
};
