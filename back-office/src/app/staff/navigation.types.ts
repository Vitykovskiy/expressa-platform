import type { StaffSection } from "../../widgets/staff/StaffNavigation.types";

export type SectionIntent =
  | { readonly kind: "valid"; readonly section: StaffSection }
  | { readonly kind: "invalid" };
