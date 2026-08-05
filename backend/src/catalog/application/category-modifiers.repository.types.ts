export type CategoryModifierGroup = {
  categoryId: string;
  groupId: string;
  sortOrder: number;
};

export type CategoryModifierGroupsAuditEvent = {
  actorId: string;
  requestId: string;
  categoryId: string;
  before: readonly CategoryModifierGroup[];
  after: readonly CategoryModifierGroup[];
};

export type ReplaceCategoryModifierGroupsCommand = {
  categoryId: string;
  groupIds: readonly string[];
  actorId: string;
  requestId: string;
};

export interface CategoryModifiersRepository {
  categoryExists(categoryId: string): Promise<boolean>;
  findCurrentModifierGroupIds(groupIds: readonly string[]): Promise<readonly string[]>;
  findByCategoryId(categoryId: string): Promise<readonly CategoryModifierGroup[]>;
  replace(categoryId: string, groupIds: readonly string[]): Promise<readonly CategoryModifierGroup[]>;
  writeAudit(event: CategoryModifierGroupsAuditEvent): Promise<void>;
}

export interface CategoryModifiersUnitOfWork {
  run<Result>(
    command: (repository: CategoryModifiersRepository) => Promise<Result>,
    audit: (repository: CategoryModifiersRepository, result: Result) => Promise<void>,
  ): Promise<Result>;
}
