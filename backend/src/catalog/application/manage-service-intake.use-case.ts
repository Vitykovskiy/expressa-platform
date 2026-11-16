import type { ServiceIntakeCommand } from "./manage-service-intake.use-case.types";

export type { ServiceIntakeCommand } from "./manage-service-intake.use-case.types";
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
