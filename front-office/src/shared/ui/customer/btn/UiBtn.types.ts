export type UiBtnType = "button" | "submit" | "reset";

export interface UiBtnProps {
  disabled?: boolean;
  loading?: boolean;
  type?: UiBtnType;
  to?: RouteLocationRaw;
}

export interface UiBtnEmits {
  click: [event: MouseEvent];
}
import type { RouteLocationRaw } from "vue-router";
