import { HttpStatus } from "@nestjs/common";

export const clientMessages: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "Bad request",
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.FORBIDDEN]: "Forbidden",
  [HttpStatus.NOT_FOUND]: "Not found",
  [HttpStatus.CONFLICT]: "Conflict",
  [HttpStatus.TOO_MANY_REQUESTS]: "Too many requests",
  [HttpStatus.SERVICE_UNAVAILABLE]: "Service unavailable",
};
