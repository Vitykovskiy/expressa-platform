import type { AvailabilityContext } from "./availability.types";

export interface AvailabilityPageProps {
  readonly context: AvailabilityContext;
}

export type AvailabilityHeadingElement = globalThis.HTMLHeadingElement;
export type AvailabilityScrollElement = globalThis.HTMLElement;
