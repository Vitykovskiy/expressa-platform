import type {
  AvailabilityRepository,
  ServiceIntake,
} from "./admin-catalog.repository.types";

export class ManageServiceIntakeUseCase {
  constructor(private readonly repository: AvailabilityRepository) {}

  async execute(command: ServiceIntakeCommand): Promise<ServiceIntake> {
    return this.repository.updateServiceIntake(command);
  }
}

export type ServiceIntakeCommand = {
  acceptsNewOrders: boolean;
  actorId: string;
  requestId: string;
};
