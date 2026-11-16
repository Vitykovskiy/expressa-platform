export type LogRecord = {
  event: "http_request" | "http_error";
  level: "info" | "error";
  method: string;
  path: string;
  requestId: string;
  statusCode: number;
  durationMs?: number;
};
