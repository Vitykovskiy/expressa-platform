export type UiBtnType = "button" | "submit" | "reset";
export type UiBtnNavigationDirection = "back" | "forward";

export interface UiBtnProps {
  disabled?: boolean;
  loading?: boolean;
  navigation?: boolean;
  navigationDirection?: UiBtnNavigationDirection;
  type?: UiBtnType;
  to?: RouteLocationRaw;
}

export interface UiBtnEmits {
  click: [event: MouseEvent];
}
import type { RouteLocationRaw } from "vue-router";
