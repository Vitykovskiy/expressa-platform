import { CatalogApiError } from "../../shared/api/catalog.api";
import { ApiError } from "../../shared/api/client";
import type { OperationContext } from "../../shared/lib/operations/operation.types";
import {
  domainMessages,
  fieldConstraintMessages,
  operationMessages,
} from "./error-taxonomy.constants";
import type {
  ErrorClassification,
  FailureNotice,
  NormalizedFailure,
} from "./error-taxonomy.types";

export function classifyError(
  error: unknown,
  context: OperationContext,
): ErrorClassification {
  const failure = toNormalizedFailure(error);

  if (failure !== null && failure.transportKind === "cancelled") {
    return { kind: "cancelled" };
  }

  if (failure !== null) {
    const authField = classifyAuthField(failure, context);
    if (authField !== null) return authField;

    const fields = classifyFields(failure, context, error);
    if (fields !== null) return fields;

    const domainMessage = domainMessageFor(failure);
    if (domainMessage !== null) {
      return {
        category: "domain",
        kind: "domainRefusal",
        code: failure.code,
        level: "warning",
        message: domainMessage,
        occurrenceId: failure.occurrenceId,
        requestId: failure.requestId,
        status: failure.status,
      };
    }

    return {
      category: failure.transportKind === "client" ? "client" : "technical",
      clientStack:
        failure.transportKind === "client"
          ? sanitizedClientStack(error)
          : undefined,
      kind: "failure",
      code: failure.code,
      level:
        context.kind === "mutation" && isAmbiguous(failure)
          ? "warning"
          : "error",
      message:
        context.kind === "mutation" && isAmbiguous(failure)
          ? "Не удалось подтвердить сохранение"
          : operationMessageFor(context.operationKey),
      occurrenceId: failure.occurrenceId,
      requestId: failure.requestId,
      status: failure.status,
    };
  }

  return {
    category: "client",
    clientStack: sanitizedClientStack(error),
    kind: "failure",
    code: "UNEXPECTED_CLIENT_ERROR",
    level: "error",
    message: operationMessageFor(context.operationKey),
    occurrenceId: crypto.randomUUID(),
    requestId: null,
    status: null,
  };
}

function toNormalizedFailure(error: unknown): NormalizedFailure | null {
  if (error instanceof ApiError) return error;

  if (error instanceof CatalogApiError) {
    return {
      code: error.code,
      details: error.details,
      occurrenceId: error.occurrenceId,
      requestId: error.requestId,
      status: error.status,
      transportKind: error.transportKind,
    };
  }

  return null;
}

function classifyFields(
  failure: NormalizedFailure,
  context: OperationContext,
  error: unknown,
) {
  if (failure.code !== "VALIDATION_ERROR" || context.fieldTargets === undefined)
    return null;

  const fields = validationFields(failure.details);
  if (fields === null || fields.length === 0) return null;

  const mapped = fields.flatMap((field) => {
    const target =
      context.fieldTargets !== undefined &&
      Object.hasOwn(context.fieldTargets, field.path)
        ? context.fieldTargets[field.path]
        : undefined;
    if (target === undefined) return [];
    const message = messageForField(field);

    return message === null ? [] : [{ message, path: target.path }];
  });

  if (mapped.length === 0) return null;
  if (mapped.length === fields.length)
    return { kind: "fieldValidation" as const, fields: mapped };

  return {
    kind: "fieldValidation" as const,
    fields: mapped,
    notification: failureNotice(failure, context, error),
  };
}

function classifyAuthField(
  failure: NormalizedFailure,
  context: OperationContext,
): ErrorClassification | null {
  const message =
    failure.code === "AUTH_CODE_INVALID"
      ? "Неверный код"
      : failure.code === "AUTH_CODE_EXPIRED"
        ? "Срок действия кода истёк"
        : null;
  if (
    message === null ||
    context.fieldTargets === undefined ||
    !Object.hasOwn(context.fieldTargets, "code")
  )
    return null;

  return {
    kind: "fieldValidation",
    fields: [{ message, path: context.fieldTargets.code.path }],
  };
}

function validationFields(
  value: unknown,
): readonly { path: string; reason: string }[] | null {
  if (
    !isRecord(value) ||
    !Object.hasOwn(value, "fields") ||
    Object.keys(value).length !== 1
  )
    return null;
  return Array.isArray(value.fields) && value.fields.every(isValidationField)
    ? value.fields
    : null;
}

function isValidationField(
  value: unknown,
): value is { path: string; reason: string } {
  return (
    isRecord(value) &&
    Object.hasOwn(value, "path") &&
    typeof value.path === "string" &&
    Object.hasOwn(value, "reason") &&
    typeof value.reason === "string"
  );
}

function messageForField(field: {
  path: string;
  reason: string;
}): string | null {
  const key = field.path.split(".").at(-1);
  if (key === undefined || !Object.hasOwn(fieldConstraintMessages, key))
    return null;

  const constraints =
    fieldConstraintMessages[key as keyof typeof fieldConstraintMessages];

  return Object.hasOwn(constraints, field.reason)
    ? constraints[field.reason as keyof typeof constraints]
    : null;
}

function domainMessageFor(failure: NormalizedFailure): string | null {
  if (failure.code === "AUTH_RATE_LIMITED" || failure.status === 429)
    return domainMessages.AUTH_RATE_LIMITED;
  return Object.hasOwn(domainMessages, failure.code)
    ? domainMessages[failure.code as keyof typeof domainMessages]
    : null;
}

function isAmbiguous(failure: NormalizedFailure): boolean {
  return (
    failure.transportKind === "network" ||
    failure.transportKind === "timeout" ||
    failure.transportKind === "contract"
  );
}

function failureNotice(
  failure: NormalizedFailure,
  context: OperationContext,
  error: unknown,
): FailureNotice {
  const unconfirmed = context.kind === "mutation" && isAmbiguous(failure);

  return {
    category: failure.transportKind === "client" ? "client" : "technical",
    clientStack:
      failure.transportKind === "client"
        ? sanitizedClientStack(error)
        : undefined,
    code: failure.code,
    level: unconfirmed ? "warning" : "error",
    message: unconfirmed
      ? "Не удалось подтвердить сохранение"
      : operationMessageFor(context.operationKey),
    occurrenceId: failure.occurrenceId,
    requestId: failure.requestId,
    status: failure.status,
  };
}

function sanitizedClientStack(error: unknown): string | undefined {
  if (!(error instanceof Error) || typeof error.stack !== "string")
    return undefined;

  const frames = error.stack
    .split("\n")
    .flatMap((line) => {
      const match = line.match(
        /^\s*at\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s+\(([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?):(\d+):(\d+)\)$/,
      );
      return match === null
        ? []
        : [`at ${match[1]} (${match[2]}:${match[3]}:${match[4]})`];
    })
    .slice(0, 4);

  return frames.length === 0 ? undefined : frames.join("\n");
}

function operationMessageFor(operationKey: string): string {
  return Object.hasOwn(operationMessages, operationKey)
    ? operationMessages[operationKey as keyof typeof operationMessages]
    : "Не удалось выполнить действие";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
