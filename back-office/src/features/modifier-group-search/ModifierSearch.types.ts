export interface ModifierSearchProps {
  search: string;
  disabled: boolean;
  loading: boolean;
  showRefresh: boolean;
}
export interface ModifierSearchEmits {
  search: [value: string];
  refresh: [];
}
