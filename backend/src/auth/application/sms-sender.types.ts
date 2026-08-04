import type { RussianPhone } from '../domain/phone.types';

export interface SmsSender {
  send(phone: RussianPhone, code: string): Promise<void>;
}
