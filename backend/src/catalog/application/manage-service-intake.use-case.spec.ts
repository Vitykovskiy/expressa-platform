import { ManageServiceIntakeUseCase } from "./manage-service-intake.use-case";
import type { AvailabilityRepository } from "./admin-catalog.repository.types";

describe("ManageServiceIntakeUseCase", () => {
  it("передаёт автора, время фиксирует репозиторий", async () => {
    const result = {
      acceptsNewOrders: false,
      updatedBy: "staff",
      updatedByLabel: "+79991234567",
      updatedAt: new Date("2030-01-01T00:00:00.000Z"),
    };
    const repository: AvailabilityRepository = {
      updateAvailability: jest.fn(),
      updateServiceIntake: jest.fn().mockResolvedValue(result),
    };
    const command = {
      acceptsNewOrders: false,
      actorId: "staff",
      requestId: "request",
    };

    await expect(
      new ManageServiceIntakeUseCase(repository).execute(command),
    ).resolves.toBe(result);
    expect(repository.updateServiceIntake).toHaveBeenCalledWith(command);
  });
});
