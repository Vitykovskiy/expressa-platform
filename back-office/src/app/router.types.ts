import type { RouterHistory } from "vue-router";

import type { AdminSection } from "../admin/shared/ui/Admin.types";
import type { BackOfficeRole } from "./navigation.types";

declare module "vue-router" {
  interface RouteMeta {
    allowedRoles?: BackOfficeRouteMeta["allowedRoles"];
    requiresStaff?: BackOfficeRouteMeta["requiresStaff"];
    section?: BackOfficeRouteMeta["section"];
    title: BackOfficeRouteMeta["title"];
  }
}

export type BackOfficeRouteMeta = {
  allowedRoles?: readonly BackOfficeRole[];
  requiresStaff?: boolean;
  section?: AdminSection;
  title: string;
};

export type CreateBackOfficeRouterOptions = {
  history?: RouterHistory;
};
