import { isCurrentUserProfile } from "./auth.api";
import type { AuthApiClient } from "./auth.api.types";
import { customerRegistrationPath } from "./customer-registration.api.constants";
import type { CompleteCustomerRegistration } from "./customer-registration.api.types";

export function createCustomerRegistrationApi(
  client: AuthApiClient,
): CompleteCustomerRegistration {
  return (accessToken, name) =>
    client.request(customerRegistrationPath, isCurrentUserProfile, {
      method: "POST",
      expectedStatus: 200,
      headers: { authorization: `Bearer ${accessToken}` },
      body: { name },
    });
}
