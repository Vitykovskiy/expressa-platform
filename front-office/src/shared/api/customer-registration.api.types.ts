import type { CurrentUserProfile } from "./auth.api.types";

export type CompleteCustomerRegistration = (
  accessToken: string,
  name: string,
) => Promise<CurrentUserProfile>;
