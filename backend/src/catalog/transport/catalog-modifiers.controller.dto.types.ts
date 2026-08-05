import type { CatalogModifierSelectionType } from '../domain/catalog.types';
export type ModifierGroupDto = { id: string; name: string; selectionType: CatalogModifierSelectionType; minSelect: number; maxSelect: number; isActive: boolean; options: ModifierOptionDto[] };
export type ModifierOptionDto = { id: string; groupId: string; name: string; priceDeltaMinor: number; sortOrder: number; isDefault: boolean; isAvailable: boolean };
export type ModifierRequestContext = { requestId?: string };
