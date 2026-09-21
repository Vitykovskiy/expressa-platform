import { ManageAvailabilityUseCase } from "./manage-availability.use-case";
import type { AvailabilityRepository } from "./admin-catalog.repository.types";

describe("ManageAvailabilityUseCase", () => {
  it("passes a current price-choice availability command unchanged", async () => {
    const repository: AvailabilityRepository = {
      updateAvailability: jest.fn().mockResolvedValue({
        type: "price_choice",
        id: "choice",
        isAvailable: false,
      }),
      updateServiceIntake: jest.fn(),
    };
    const command = {
      type: "price_choice" as const,
      id: "choice",
      isAvailable: false,
      actorId: "staff",
      requestId: "request",
    };
    await expect(
      new ManageAvailabilityUseCase(repository).execute(command),
    ).resolves.toEqual({
      type: "price_choice",
      id: "choice",
      isAvailable: false,
    });
    expect(repository.updateAvailability).toHaveBeenCalledWith(command);
  });
});
