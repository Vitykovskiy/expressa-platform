import type { AdminSection } from "../../shared/ui/admin/Admin.types";

export interface TabBarSection {
  id: AdminSection;
  label: string;
}

export interface TabBarProps {
  sections: TabBarSection[];
  activeSection: AdminSection;
}

export interface TabBarEmits {
  logout: [];
  select: [section: AdminSection];
}
