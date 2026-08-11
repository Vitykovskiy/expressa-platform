import type { AdminSection, UserRole } from "../../shared/ui/admin/Admin.types";

export interface SideNavSection {
  id: AdminSection;
  label: string;
}

export interface SideNavProps {
  role: UserRole;
  sections: SideNavSection[];
  activeSection: AdminSection;
}

export interface SideNavEmits {
  select: [section: AdminSection];
  logout: [];
}
