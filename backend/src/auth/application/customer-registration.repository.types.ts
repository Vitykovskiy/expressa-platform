import type { AuthUser } from "./auth-repository.types";

export type RegisteredAuthUser = AuthUser & { name: string | null };

export type CustomerRegistrationCommand = {
  userId: string;
  sessionId: string;
  name: string;
  now: Date;
};

export interface CustomerRegistrationRepository {
  findCurrentUser(
    sessionId: string,
    now: Date,
  ): Promise<RegisteredAuthUser | null>;
  complete(command: CustomerRegistrationCommand): Promise<RegisteredAuthUser>;
}
