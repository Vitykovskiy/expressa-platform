export interface AuthPageProps {
  readonly restoring: boolean;
  readonly staffHandoff: boolean;
}

export type AuthPageElement = globalThis.HTMLElement;

export interface AuthPageEmits {
  authenticated: [];
  error: [message: string];
}
