import type { Component } from "vue";

export type AdminIconSize = "action" | "status" | "field" | "state";

export interface AdminIconProps {
  icon: Component;
  size?: AdminIconSize;
}
