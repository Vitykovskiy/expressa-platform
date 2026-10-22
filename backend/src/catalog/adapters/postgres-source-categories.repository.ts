import type {
  SourceCategoriesUnitOfWork,
  SourceCategoryRepositories,
} from "../application/source-menu.types";
import { PostgresCatalogCommandRunner } from "./postgres-catalog-command.runner";
import { PostgresCategoriesTransactionRepository } from "./postgres-categories.repository";
import { PostgresCategoryModifiersTransactionRepository } from "./postgres-category-modifiers.repository";

export class PostgresSourceCategoriesRepository implements SourceCategoriesUnitOfWork {
  constructor(private readonly runner: PostgresCatalogCommandRunner) {}

  run<Result>(
    command: (repositories: SourceCategoryRepositories) => Promise<Result>,
    audit: (
      repositories: SourceCategoryRepositories,
      result: Result,
    ) => Promise<void>,
  ): Promise<Result> {
    return this.runner.run(
      (client) =>
        command({
          categories: new PostgresCategoriesTransactionRepository(client),
          associations: new PostgresCategoryModifiersTransactionRepository(
            client,
          ),
        }),
      (client, result) =>
        audit(
          {
            categories: new PostgresCategoriesTransactionRepository(client),
            associations: new PostgresCategoryModifiersTransactionRepository(
              client,
            ),
          },
          result,
        ),
    );
  }
}
