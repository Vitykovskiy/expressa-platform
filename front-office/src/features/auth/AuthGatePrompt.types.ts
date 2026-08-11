export interface AuthGatePromptProps {
  title: string;
  message: string;
  note: string;
  confirmLabel: string;
}

export type AuthGatePromptEmits = {
  confirm: [];
};
