import type {
  AdminCatalogRepository,
  AvailabilityRepository,
} from "../application/admin-catalog.repository.types";

export type AdminCatalogPorts = AdminCatalogRepository & AvailabilityRepository;

export type DatabaseRow = Record<string, unknown>;
