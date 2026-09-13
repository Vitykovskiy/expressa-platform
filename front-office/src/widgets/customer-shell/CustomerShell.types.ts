import type {
  ShellNavigationCategory,
  ShellNavigationDestination,
} from "./ShellNavigation.types";

export interface CustomerShellProps {
  activeDestination: ShellNavigationDestination;
  accountLabel: string;
  cartCount: number;
  categories: ShellNavigationCategory[];
  isAuthenticated: boolean;
  isLogoutPending: boolean;
  selectedCategoryId?: string;
}

export interface CustomerShellEmits {
  goMenu: [];
  navigate: [destination: ShellNavigationDestination];
  selectCategory: [categoryId: string];
  openAccount: [];
  signOut: [];
  openAuth: [];
  openCart: [];
  openOrders: [];
}
