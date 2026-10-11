import type { VNode } from "vue";
import type { UserRole } from "../entities/session/session.types";
import type { StaffSection } from "./navigation.types";

export interface StaffShellProps {
  staff: boolean;
  role: UserRole | null;
  busy: boolean;
  error: string;
  section: StaffSection;
  links: readonly { id: StaffSection; label: string; href: string }[];
}
export interface StaffShellEmits {
  logout: [];
  navigate: [section: StaffSection, event: MouseEvent];
}
export interface StaffShellSlots {
  default: () => VNode[];
  notifications?: () => VNode[];
  "notification-order"?: () => VNode[];
}
