import type { VNode } from "vue";

export interface UiBadgeProps {
  tone?: "neutral" | "warning" | "danger";
}
export interface UiBadgeSlots {
  default: () => VNode[];
}
