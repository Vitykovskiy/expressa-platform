import type { VNode } from "vue";

export type FeedbackKind = "loading" | "empty" | "error" | "success";
export interface UiFeedbackProps {
  kind: FeedbackKind;
  text: string;
  announced?: boolean;
}
export interface UiFeedbackSlots {
  action?: () => VNode[];
}
