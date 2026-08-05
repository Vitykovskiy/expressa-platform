import type { CatalogModifierSelectionType } from './catalog.types';
import type { modifierAdminErrorCodes } from './modifier-admin.policy.constants';

export type ModifierAdminErrorCode = (typeof modifierAdminErrorCodes)[number];
export type ModifierGroupDetails = { name: string; selectionType: CatalogModifierSelectionType; minSelect: number; maxSelect: number; isActive: boolean };
export type ModifierOptionDetails = { name: string; priceDeltaMinor: number; sortOrder: number; isDefault: boolean; isAvailable: boolean };
export type ModifierOptionInput = ModifierOptionDetails & { id?: string };
export type AdminModifierOption = ModifierOptionDetails & { id: string; groupId: string; archivedAt: Date | null };
export type AdminModifierGroup = ModifierGroupDetails & { id: string; archivedAt: Date | null; options: AdminModifierOption[] };
