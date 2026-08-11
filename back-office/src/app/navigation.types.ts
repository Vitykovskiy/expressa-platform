import type { AdminSection } from "../shared/ui/admin/Admin.types";

export type BackOfficeRole = "barista" | "administrator";

export type NavigationItem = {
  label: string;
  path: string;
  roles: readonly BackOfficeRole[];
  section: AdminSection;
};
