import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RolePolicy } from "../domain/auth.types";
import type {
  AuthenticatedRequest,
  CurrentAuth,
} from "./current-auth.decorator.types";
import { rolesMetadataKey } from "./roles.decorator.constants";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RolePolicy>(
      rolesMetadataKey,
      [context.getHandler(), context.getClass()],
    );
    if (policy === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<unknown>();
    if (!isAuthenticatedRequest(request) || request.auth === undefined) {
      throw new UnauthorizedException();
    }

    if (this.isAllowed(request.auth, policy)) {
      return true;
    }

    throw new HttpException(
      { code: "ACCESS_DENIED", details: null, message: "Access denied" },
      HttpStatus.FORBIDDEN,
    );
  }

  private isAllowed(auth: CurrentAuth, policy: RolePolicy): boolean {
    if (policy === "CustomerContext") {
      return auth.context === "customer";
    }
    if (policy === "Customer") {
      return auth.context === "customer" && auth.customer !== null;
    }
    const staff =
      auth.context === "staff" &&
      auth.employee !== null &&
      auth.employee.accessEnabled;
    if (policy === "CustomerOrBarista") {
      return (
        auth.context === "customer" ||
        (staff && auth.employee?.role === "barista")
      );
    }
    if (policy === "Staff") {
      return staff;
    }
    if (policy === "Administrator") {
      return staff && auth.employee?.role === "administrator";
    }
    return false;
  }
}

function isAuthenticatedRequest(value: unknown): value is AuthenticatedRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "headers" in value &&
    typeof value.headers === "object" &&
    value.headers !== null
  );
}
