import type { AuthStep } from "../useAuthEntry.types";

export interface AuthCardProps {
  readonly step: AuthStep;
  readonly phone: string;
  readonly code: string;
  readonly phoneInvalid: boolean;
  readonly canSend: boolean;
  readonly canConfirm: boolean;
}

export interface AuthCardEmits {
  phoneChanged: [value: string];
  codeChanged: [value: string];
  sendRequested: [];
  confirmRequested: [];
  changeNumberRequested: [];
  invalidPhoneSubmitted: [];
}
