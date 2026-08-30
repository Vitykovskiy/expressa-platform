import type { Clock } from "../application/clock.types";

export class SystemClockAdapter implements Clock {
  now(): Date {
    return new Date();
  }
}
