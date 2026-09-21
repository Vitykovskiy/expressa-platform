import type {
  AdminCatalogCandidates,
  AdminCatalogV3Candidates,
  AdminCatalogRepository,
} from "./admin-catalog.repository.types";

export class GetAdminCatalogUseCase {
  constructor(private readonly repository: AdminCatalogRepository) {}

  async executeAvailability(): Promise<AdminCatalogCandidates> {
    return this.repository.findCandidates();
  }
  async executeV3(): Promise<AdminCatalogV3Candidates> {
    return this.repository.findV3Candidates();
  }
}
