import { contractFailure, request } from "../../shared/api/transport";
import { availabilityEndpoint, intakeEndpoint } from "./availability.constants";
import { mapAvailability } from "./availability.mapper";
import {
  parseAvailability,
  parseAvailabilityTarget,
  parseIntake,
} from "./availability.validation";
import type { AvailabilityIntent } from "./availability.types";

export async function readAvailability(token: string, signal: AbortSignal) {
  return mapAvailability(
    parseAvailability(
      await request(availabilityEndpoint, {
        token,
        signal,
        expectedStatus: 200,
      }),
    ),
  );
}

export async function changeAvailability(
  token: string,
  intent: AvailabilityIntent,
) {
  if (intent.kind === "intake") {
    const intake = parseIntake(
      await request(intakeEndpoint, {
        token,
        method: "PATCH",
        body: { acceptsNewOrders: intent.requested },
        expectedStatus: 200,
      }),
    );

    if (intake.acceptsNewOrders !== intent.requested) contractFailure();

    return intake;
  }

  if (intent.id === null) return contractFailure();

  const path =
    intent.kind === "price_choice"
      ? `/api/v3/backoffice/availability/price-choice/${intent.id}`
      : `${availabilityEndpoint}/${intent.kind}/${intent.id}`;

  return parseAvailabilityTarget(
    await request(path, {
      token,
      method: "PATCH",
      body: { isAvailable: intent.requested },
      expectedStatus: 200,
    }),
    intent.kind,
    intent.id,
    intent.requested,
  );
}
