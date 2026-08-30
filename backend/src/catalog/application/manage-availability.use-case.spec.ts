import { ManageAvailabilityUseCase } from "./manage-availability.use-case";
import type { AvailabilityRepository } from "./admin-catalog.repository.types";

describe("ManageAvailabilityUseCase", () => {
  it("передаёт атомарную команду репозиторию без изменения", async () => {
    const repository: AvailabilityRepository = {
      updateAvailability: jest.fn().mockResolvedValue({
        type: "variant",
        id: "variant",
        isAvailable: false,
      }),
      updateServiceIntake: jest.fn(),
    };
    const command = {
      type: "variant" as const,
      id: "variant",
      isAvailable: false,
      actorId: "staff",
      requestId: "request",
    };

    await expect(
      new ManageAvailabilityUseCase(repository).execute(command),
    ).resolves.toEqual({ type: "variant", id: "variant", isAvailable: false });
    expect(repository.updateAvailability).toHaveBeenCalledWith(command);
  });
});
