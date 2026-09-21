export interface MenuReorderRowProps {
  entityType: "category" | "product";
  id: string;
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  position: number;
  total: number;
  disclosable?: boolean;
  expanded?: boolean;
  disabled?: boolean;
}
export interface MenuReorderRowEmits {
  "keyboard-drag-cancel": [];
  "keyboard-drag-start": [];
  move: [request: { offset: -1 | 1; control: "handle" | "up" | "down" }];
  toggle: [];
}
