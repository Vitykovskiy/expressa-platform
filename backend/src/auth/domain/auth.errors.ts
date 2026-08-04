import type { AuthErrorCode } from './auth-errors.types';

export abstract class AuthDomainError extends Error {
  abstract readonly code: AuthErrorCode;
}

export class InvalidPhoneError extends AuthDomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor() {
    super('Номер телефона имеет недопустимый формат.');
  }
}

export class InvalidOtpCodeError extends AuthDomainError {
  readonly code = 'AUTH_CODE_INVALID';

  constructor() {
    super('Одноразовый код недействителен.');
  }
}

export class ExpiredOtpCodeError extends AuthDomainError {
  readonly code = 'AUTH_CODE_EXPIRED';

  constructor() {
    super('Срок действия одноразового кода истёк.');
  }
}

export class OtpRateLimitedError extends AuthDomainError {
  readonly code = 'AUTH_RATE_LIMITED';

  constructor() {
    super('Повторный запрос кода пока недоступен.');
  }
}

export class AccessDeniedError extends AuthDomainError {
  readonly code = 'ACCESS_DENIED';

  constructor() {
    super('Доступ запрещён.');
  }
}
