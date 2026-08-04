import type { IncomingMessage } from 'node:http';

export type RequestWithId = IncomingMessage & { requestId?: string };

export type StructuredErrorResponse = {
  code: string;
  message: string;
  details: unknown;
};
