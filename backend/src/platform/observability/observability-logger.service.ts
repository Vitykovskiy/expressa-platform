import { Injectable } from '@nestjs/common';

type LogRecord = {
  event: 'http_request' | 'http_error';
  level: 'info' | 'error';
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  durationMs?: number;
};

@Injectable()
export class ObservabilityLogger {
  log(record: LogRecord): void {
    process.stdout.write(`${JSON.stringify(record)}\n`);
  }
}
