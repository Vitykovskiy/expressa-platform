import type { AvailabilityCommand } from "./manage-availability.use-case.types";

export type { AvailabilityCommand } from "./manage-availability.use-case.types";
import type {
  AvailabilityRepository,
  AvailabilityTarget,
} from "./admin-catalog.repository.types";

export class ManageAvailabilityUseCase {
  constructor(private readonly repository: AvailabilityRepository) {}

  async execute(command: AvailabilityCommand): Promise<AvailabilityTarget> {
    return this.repository.updateAvailability(command);
  }
}

export class AvailabilityNotFoundError extends Error {}
