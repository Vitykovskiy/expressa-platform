import type { RussianPhone } from "../domain/phone.types";

export type SmsDeliveryFailureKind = "timeout" | "transport" | "rejected";

export class SmsDeliveryError extends Error {
  constructor(readonly kind: SmsDeliveryFailureKind) {
    super(`SMS delivery ${kind}.`);
  }
}

export interface SmsSender {
  send(phone: RussianPhone, code: string): Promise<void>;
}
