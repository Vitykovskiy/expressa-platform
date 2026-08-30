import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type {
  OriginGuardConfiguration,
  OriginRequest,
} from "./origin.guard.types";
import { originGuardConfigurationToken } from "../auth.constants";

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    @Inject(originGuardConfigurationToken)
    private readonly configuration: OriginGuardConfiguration,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<unknown>();
    const origin = isOriginRequest(request)
      ? normalizeOrigin(request.headers.origin)
      : null;

    if (origin === null) {
      throw new UnauthorizedException();
    }

    if (
      !this.configuration.allowedOrigins.some(
        (allowed) => normalizeOrigin(allowed) === origin,
      )
    ) {
      throw new HttpException(
        { code: "ACCESS_DENIED", details: null, message: "Access denied" },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}

function isOriginRequest(value: unknown): value is OriginRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "headers" in value &&
    typeof value.headers === "object" &&
    value.headers !== null
  );
}

function normalizeOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value === "null") {
    return null;
  }

  try {
    const origin = new URL(value);

    if (
      (origin.protocol !== "http:" && origin.protocol !== "https:") ||
      origin.origin !== value
    ) {
      return null;
    }

    return origin.origin;
  } catch {
    return null;
  }
}
