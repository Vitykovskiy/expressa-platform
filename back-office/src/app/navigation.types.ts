import type { AppSection } from "../layouts/AppNavigation.types";

export type SectionIntent =
  | { readonly kind: "valid"; readonly section: AppSection }
  | { readonly kind: "invalid" };
