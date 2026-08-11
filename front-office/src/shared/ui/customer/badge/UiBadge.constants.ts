import type { UiBadgeProps, UiBadgeTone } from "./UiBadge.types";

export const UI_BADGE_DEFAULTS = {
  tone: "neutral",
} satisfies Required<Pick<UiBadgeProps, "tone">>;

export const UI_BADGE_COLORS: Record<UiBadgeTone, string> = {
  neutral: "surface",
  info: "info",
  warning: "warning",
  success: "success",
  error: "error",
};
