export interface MenuReorderScope {
  categoryId: string | null;
  ids: readonly string[];
  originalIds: readonly string[];
}

export interface MenuReorderDraft {
  categoryIds: readonly string[];
  productIdsByCategory: Readonly<Record<string, readonly string[]>>;
}
