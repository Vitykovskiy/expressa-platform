import type { LogRecord } from "./observability-logger.service.types";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ObservabilityLogger {
  log(record: LogRecord): void {
    process.stdout.write(`${JSON.stringify(record)}\n`);
  }
}
