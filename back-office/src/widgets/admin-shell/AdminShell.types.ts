import type { AdminSection } from "../../shared/ui/admin/Admin.types";

export type AdminShellRole = "barista" | "administrator";

export interface AdminShellNavigationItem {
  label: string;
  section: AdminSection;
}

export interface AdminShellProps {
  activeSection: AdminSection;
  items: readonly AdminShellNavigationItem[];
  role: AdminShellRole;
}

export interface AdminShellEmits {
  navigate: [section: AdminSection];
  logout: [];
}
