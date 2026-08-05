export type ApiErrorDetails = Record<string, unknown> | null;

export type ApiValidationErrorDetails = {
  fields: ApiValidationField[];
};

export type ApiValidationField = {
  path: string;
  reason: string;
};
