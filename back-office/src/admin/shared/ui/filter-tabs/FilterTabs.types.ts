export interface FilterTab<T extends string> {
  value: T;
  label: string;
}

export type FilterTabsLayout = "contained" | "intrinsic" | "responsive";

export interface FilterTabsProps<T extends string> {
  items: readonly FilterTab<T>[];
  layout?: FilterTabsLayout;
}
