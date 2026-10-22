export interface AvailabilityContext {
  readonly accessToken: string;
  readonly identityId: string;
}

export interface AvailabilityScrollPosition {
  readonly desktop: number;
  readonly mobile: number;
}

export interface AvailabilityGroupDto {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface AvailabilityCategoryDto extends AvailabilityGroupDto {
  readonly sortOrder: number;
}

export interface AvailabilityProductDto {
  readonly id: string;
  readonly categoryId: string;
  readonly name: string;
  readonly price: number | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly isAvailable: boolean;
}

export interface AvailabilityModifierDto {
  readonly id: string;
  readonly groupId: string;
  readonly name: string;
  readonly priceDelta: number;
  readonly sortOrder: number;
  readonly isAvailable: boolean;
}

export interface AvailabilityChoiceDto {
  readonly isAvailable: boolean;
  readonly id: string;
  readonly productId: string;
  readonly portionLabel: string;
  readonly price: number;
  readonly sortOrder: number;
}

export interface AvailabilityDto {
  readonly intake: AvailabilityIntakeDto;
  readonly categories: readonly AvailabilityCategoryDto[];
  readonly products: readonly AvailabilityProductDto[];
  readonly modifierGroups: readonly AvailabilityGroupDto[];
  readonly modifierOptions: readonly AvailabilityModifierDto[];
  readonly priceChoices: readonly AvailabilityChoiceDto[];
}

export interface AvailabilityItem {
  readonly id: string;
  readonly type: "product" | "modifier" | "price-choice" | "intake";
  readonly name: string;
  readonly description: string;
  readonly available: boolean;
}

export interface AvailabilityGroup {
  readonly key: string;
  readonly name: string;
  readonly items: readonly AvailabilityItem[];
}

export type AvailabilityReadOutcome =
  | { readonly kind: "loaded"; readonly groups: readonly AvailabilityGroup[] }
  | { readonly kind: "session-expired" | "failed" | "cancelled" };

export type AvailabilityChangeOutcome =
  | {
      readonly kind: "confirmed";
      readonly available: boolean;
      readonly description?: string;
    }
  | { readonly kind: "session-expired" | "rejected" | "unknown" };

export interface AvailabilityCommand {
  readonly item: AvailabilityItem;
  readonly phase: "sending" | "checking" | "unknown";
}

export interface AvailabilityIntakeDto {
  readonly acceptsNewOrders: boolean;
  readonly updatedByLabel: string | null;
  readonly updatedAt: string | null;
}
