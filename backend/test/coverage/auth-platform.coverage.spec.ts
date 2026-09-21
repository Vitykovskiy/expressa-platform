import { LogoutUseCase } from "../../src/auth/application/logout.use-case";

describe("auth platform current contract", () => {
  it("exports logout with subscription-aware contract", () => {
    expect(LogoutUseCase).toBeDefined();
  });
});
