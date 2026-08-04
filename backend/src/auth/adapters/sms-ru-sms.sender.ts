import type { SmsSender } from '../application/sms-sender.types';
import type { RussianPhone } from '../domain/phone.types';
import { smsRuEndpoint, smsRuTimeoutMs } from './sms-ru-sms.sender.constants';
import type { SmsRuConfiguration, SmsRuMessageResponse } from './sms-ru-sms.sender.types';

export class SmsRuSmsSender implements SmsSender {
  constructor(
    private readonly configuration: SmsRuConfiguration,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async send(phone: RussianPhone, code: string): Promise<void> {
    const recipient = phone.slice(1);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), smsRuTimeoutMs);

    try {
      const response = await this.fetchImplementation(smsRuEndpoint, {
        body: new URLSearchParams({
          api_id: this.configuration.apiId,
          from: this.configuration.from,
          json: '1',
          msg: `Код подтверждения Expressa: ${code}`,
          to: recipient,
          ttl: '5',
        }),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok || !(await isSuccessfulSmsRuResponse(response, recipient))) {
        throw new Error('SMS provider did not accept the message.');
      }
    } catch {
      throw new Error('SMS delivery failed.');
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function isSuccessfulSmsRuResponse(
  response: Response,
  recipient: string,
): Promise<boolean> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return false;
  }

  if (!isRecord(body) || body.status !== 'OK' || body.status_code !== 100) {
    return false;
  }

  const message = body.sms;

  return (
    isRecord(message) &&
    isSuccessfulSmsRuMessage(message[recipient])
  );
}

function isSuccessfulSmsRuMessage(value: unknown): value is SmsRuMessageResponse {
  return (
    isRecord(value) &&
    value.status === 'OK' &&
    value.status_code === 100 &&
    typeof value.sms_id === 'string' &&
    value.sms_id !== ''
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
