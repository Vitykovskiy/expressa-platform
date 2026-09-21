import { PostgresAuthRepository } from "../../src/auth/adapters/postgres-auth.repository";

describe("PostgresAuthRepository current contract", () => {
  it("exports challenge-scoped authentication repository", () => {
    expect(PostgresAuthRepository).toBeDefined();
  });
});
