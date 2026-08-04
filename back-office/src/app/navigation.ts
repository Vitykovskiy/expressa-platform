import { navigationDefinitions } from "./navigation.constants";
import type { BackOfficeRole, NavigationItem } from "./navigation.types";

export function createNavigationItems(
  role: BackOfficeRole | null,
): readonly NavigationItem[] {
  if (role === null) return [];
  const items: readonly NavigationItem[] = Object.values(navigationDefinitions);

  return items.filter((item) => item.roles.includes(role));
}
