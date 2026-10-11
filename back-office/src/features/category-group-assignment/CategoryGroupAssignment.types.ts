import type { DeepReadonly } from "vue";
import type {
  AssociationErrors,
  AssociationIntent,
  AssociationTask,
  CatalogGroupDto,
} from "../../entities/catalog/catalog.types";

export interface AssociationGroupRow extends CatalogGroupDto {
  typeLabel: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}
export interface CategoryGroupAssignmentProps {
  task: DeepReadonly<AssociationTask>;
  groups: readonly Readonly<CatalogGroupDto>[];
  errors: DeepReadonly<AssociationErrors>;
  disabled: boolean;
  readOnly: boolean;
  active: boolean;
  confirming: boolean;
  attempting: boolean;
}
export interface AssociationConfirmationProps {
  intent: DeepReadonly<AssociationIntent> | null;
  open: boolean;
  disabled: boolean;
}
export interface AssociationConfirmationEmits {
  cancel: [];
  confirm: [];
}
export interface CategoryGroupAssignmentEmits {
  add: [id: string];
  remove: [id: string];
  move: [id: string, direction: -1 | 1];
  save: [];
  cancel: [];
}
export interface AssociationSelectionProps {
  groups: readonly Readonly<AssociationGroupRow>[];
  error: string;
  disabled: boolean;
}
export interface AssociationSelectionEmits {
  remove: [id: string];
  move: [id: string, direction: -1 | 1];
}
export interface AssociationFinderProps {
  groups: readonly Readonly<CatalogGroupDto>[];
  disabled: boolean;
}
export interface AssociationFinderEmits {
  add: [id: string];
}
