import type {
  Category,
  CategoryModifierGroupAssignment,
  ModifierGroup,
} from "./catalog.types";

export interface CategoryModifierAssignmentDraft {
  modifierGroupId: string;
  sortOrder: string;
}

export interface CategoryModifierAssignmentsProps {
  category: Category | null;
  categories: readonly Category[];
  groups: readonly ModifierGroup[];
  assignments: readonly CategoryModifierGroupAssignment[];
  disabled?: boolean;
  loading?: boolean;
  errorMessage?: string;
}

export interface CategoryModifierAssignmentsEmits {
  save: [assignments: readonly CategoryModifierGroupAssignment[]];
  cancel: [];
}
