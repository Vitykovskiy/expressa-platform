import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RolePolicy } from '../domain/auth.types';
import type { AuthenticatedRequest, CurrentAuth } from './current-auth.decorator.types';
import { rolesMetadataKey } from './roles.decorator.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RolePolicy>(rolesMetadataKey, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (policy === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<unknown>();
    if (!isAuthenticatedRequest(request) || request.auth === undefined) {
      throw new UnauthorizedException();
    }

    if (isAllowed(request.auth.role, policy)) {
      return true;
    }

    throw new HttpException(
      { code: 'ACCESS_DENIED', details: null, message: 'Access denied' },
      HttpStatus.FORBIDDEN,
    );
  }
}

function isAuthenticatedRequest(value: unknown): value is AuthenticatedRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'headers' in value &&
    typeof value.headers === 'object' &&
    value.headers !== null
  );
}

function isAllowed(role: CurrentAuth['role'], policy: RolePolicy): boolean {
  if (policy === 'Customer') return role === 'customer';
  if (policy === 'Staff') return role === 'barista' || role === 'administrator';

  return role === 'administrator';
}
