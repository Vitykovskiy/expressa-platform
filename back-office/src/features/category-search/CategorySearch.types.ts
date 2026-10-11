export interface CategorySearchProps {
  search: string;
  loading: boolean;
  disabled: boolean;
  showRefresh: boolean;
}
export interface CategorySearchEmits {
  search: [value: string];
  refresh: [];
}
