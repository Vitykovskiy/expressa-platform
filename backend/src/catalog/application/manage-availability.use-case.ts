import type { AvailabilityEntityType, AvailabilityRepository, AvailabilityTarget } from './admin-catalog.repository.types';

export class ManageAvailabilityUseCase {
  constructor(private readonly repository: AvailabilityRepository) {}

  async execute(command: AvailabilityCommand): Promise<AvailabilityTarget> {
    return this.repository.updateAvailability(command);
  }
}

export type AvailabilityCommand = {
  type: AvailabilityEntityType;
  id: string;
  isAvailable: boolean;
  actorId: string;
  requestId: string;
};

export class AvailabilityNotFoundError extends Error {}
