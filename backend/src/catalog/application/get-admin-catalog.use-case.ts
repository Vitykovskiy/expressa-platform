import type {
  AdminCatalogCandidates,
  AdminCatalogRepository,
} from "./admin-catalog.repository.types";

export class GetAdminCatalogUseCase {
  constructor(private readonly repository: AdminCatalogRepository) {}

  async execute(): Promise<AdminCatalogCandidates> {
    return this.repository.findCandidates();
  }
}
