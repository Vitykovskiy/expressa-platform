import type { DeepReadonly } from "vue";
import type {
  ModifierDraft,
  ModifierErrors,
  ModifierTask,
  ModifierErrorFocus,
  ModifierValidationTarget,
} from "../../entities/catalog/catalog.types";

export interface ModifierFormProps {
  task: DeepReadonly<ModifierTask>;
  draft: DeepReadonly<ModifierDraft>;
  errors: DeepReadonly<ModifierErrors>;
  errorFocus: DeepReadonly<ModifierErrorFocus> | null;
  title: string;
  revision: number;
  active: boolean;
  creating: boolean;
  readOnly: boolean;
  disabled: boolean;
  mutationDisabled: boolean;
  dirty: boolean;
  busy: boolean;
  attempting: boolean;
  canArchive: boolean;
  confirming: boolean;
}
export interface ModifierFormEmits {
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
