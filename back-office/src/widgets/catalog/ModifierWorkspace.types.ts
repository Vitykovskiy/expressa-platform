import type { DeepReadonly } from "vue";
import type {
  Catalog,
  ModifierDraft,
  ModifierErrors,
  ModifierTask,
  ModifierErrorFocus,
  ModifierValidationTarget,
} from "../../entities/catalog/catalog.types";

export interface ModifierWorkspaceProps {
  data: DeepReadonly<Catalog>;
  task: DeepReadonly<ModifierTask> | null;
  errors: DeepReadonly<ModifierErrors>;
  errorFocus: DeepReadonly<ModifierErrorFocus> | null;
  search: string;
  active: boolean;
  loading: boolean;
  disabled: boolean;
  mutationDisabled: boolean;
  readOnly: boolean;
  dirty: boolean;
  busy: boolean;
  attempting: boolean;
  reconciled: boolean;
  confirming: boolean;
  showRefresh: boolean;
}
export interface ModifierWorkspaceEmits {
  search: [value: string];
  refresh: [];
  create: [];
  select: [id: string];
  reorder: [id: string];
  draft: [value: ModifierDraft];
  validate: [
    target: ModifierValidationTarget,
    context: DeepReadonly<ModifierTask>,
    revision: number,
  ];
  add: [];
  remove: [key: number];
  restore: [key: number];
  move: [key: number, direction: -1 | 1];
  save: [];
  cancel: [];
  archive: [];
}
