import { isCurrentUserProfileDto, mapCurrentUserProfile } from "./auth.api";
import type { AuthApiClient } from "./auth.api.types";
import { customerRegistrationPath } from "./customer-registration.api.constants";
import type { CompleteCustomerRegistration } from "./customer-registration.api.types";

export function createCustomerRegistrationApi(
  client: AuthApiClient,
): CompleteCustomerRegistration {
  return async (accessToken, name) =>
    mapCurrentUserProfile(
      await client.request(customerRegistrationPath, isCurrentUserProfileDto, {
        method: "POST",
        expectedStatus: 200,
        headers: { authorization: `Bearer ${accessToken}` },
        body: { name },
      }),
    );
}
