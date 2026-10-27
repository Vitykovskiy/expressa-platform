export class CustomerRegistrationForbiddenError extends Error {}

export class CustomerRegistrationUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Customer registration storage is unavailable.", { cause });
  }
}

export class CustomerRegistrationNameConflictError extends Error {}
