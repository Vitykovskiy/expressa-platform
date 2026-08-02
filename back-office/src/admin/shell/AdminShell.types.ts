import type { AdminSection, UserRole } from "../shared/ui/Admin.types";

export interface AdminShellSection {
  id: AdminSection;
  label: string;
  roles: UserRole[];
}

export interface AdminShellProps {
  role: UserRole;
  activeSection: AdminSection;
}

export interface AdminShellEmits {
  navigate: [section: AdminSection];
  logout: [];
}
