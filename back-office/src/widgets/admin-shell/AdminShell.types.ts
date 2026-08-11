import type {
  BackOfficeRole,
  NavigationItem,
} from "../../app/navigation.types";
import type { AdminSection } from "../../shared/ui/admin/Admin.types";

export interface AdminShellProps {
  activeSection: AdminSection;
  items: readonly NavigationItem[];
  role: BackOfficeRole;
}

export interface AdminShellEmits {
  navigate: [section: AdminSection];
  logout: [];
}
