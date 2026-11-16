import type { IncomingMessage } from "node:http";

export type RequestWithId = IncomingMessage & {
  baseUrl?: string;
  requestId?: string;
  route?: { path?: string };
};
