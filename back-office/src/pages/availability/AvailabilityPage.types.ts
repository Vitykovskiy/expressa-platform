import type { AvailabilityContext } from "../../entities/availability/availability.types";

export interface AvailabilityPageProps {
  readonly context: AvailabilityContext;
}

export type AvailabilityHeadingElement = globalThis.HTMLHeadingElement;
export type AvailabilityScrollElement = globalThis.HTMLElement;
