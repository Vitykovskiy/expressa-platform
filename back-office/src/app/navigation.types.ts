import type { AdminSection } from "../admin/shared/ui/Admin.types";

export type BackOfficeRole = "barista" | "administrator";

export type NavigationItem = {
  label: string;
  path: string;
  roles: readonly BackOfficeRole[];
  section: AdminSection;
};
