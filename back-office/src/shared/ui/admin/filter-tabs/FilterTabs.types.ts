export interface FilterTab<T extends string> {
  value: T;
  label: string;
}

export type FilterTabsLayout =
  | "contained"
  | "intrinsic"
  | "responsive"
  | "wrapped"
  | "balanced-pairs"
  | "bounded-wrapped";

export interface FilterTabsProps<T extends string> {
  disabled?: boolean;
  items: readonly FilterTab<T>[];
  layout?: FilterTabsLayout;
}
