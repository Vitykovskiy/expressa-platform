export interface ApiHttpErrorDto {
  readonly code: string;
  readonly message: string;
  readonly details: object | null;
  readonly requestId: string;
}
