export interface FilterTab<T extends string> {
  value: T;
  label: string;
}

export interface FilterTabsProps<T extends string> {
  items: readonly FilterTab<T>[];
}
