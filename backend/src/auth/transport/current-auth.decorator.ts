import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  AuthenticatedRequest,
  CurrentAuth as CurrentAuthData,
} from "./current-auth.decorator.types";

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentAuthData => {
    const request = context.switchToHttp().getRequest<unknown>();

    if (!isAuthenticatedRequest(request) || request.auth === undefined) {
      throw new UnauthorizedException();
    }

    return request.auth;
  },
);

function isAuthenticatedRequest(value: unknown): value is AuthenticatedRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "headers" in value &&
    typeof value.headers === "object" &&
    value.headers !== null
  );
}
