import type { FeedbackKind } from "../../shared/ui/UiFeedback/UiFeedback.types";

export type SaveState = "idle" | "pending" | "error" | "success";
export interface DemoFeedback {
  kind: FeedbackKind;
  text: string;
}

export interface DemoRow {
  id: string;
  name: string;
  available: boolean;
  tone: "neutral" | "warning" | "danger";
  label: string;
}
