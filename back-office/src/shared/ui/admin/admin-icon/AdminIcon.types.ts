import type { Component } from "vue";

export type AdminIconSize = "action" | "status";

export interface AdminIconProps {
  icon: Component;
  size?: AdminIconSize;
}
