import type { AvailabilityEntityType, AvailabilityTarget, ServiceIntake } from '../application/admin-catalog.repository.types';

export type AvailabilityUpdateDto = AvailabilityTarget;
export type ServiceIntakeDto = ServiceIntake;
export type AvailabilityRequestContext = { requestId?: string };
export type AvailabilityUpdateRequest = { isAvailable?: unknown };
export type ServiceIntakeRequest = { acceptsNewOrders?: unknown };
export type AvailabilityRouteType = AvailabilityEntityType;
