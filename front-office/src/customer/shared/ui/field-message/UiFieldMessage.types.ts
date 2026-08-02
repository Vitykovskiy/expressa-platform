export type UiFieldMessageTone =
  "neutral" | "info" | "warning" | "error" | "success";
export interface UiFieldMessageProps {
  message?: string;
  tone?: UiFieldMessageTone;
}
