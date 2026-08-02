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
  selectedCategoryId?: string;
  showBack: boolean;
}

export interface CustomerShellEmits {
  back: [];
  goMenu: [];
  navigate: [destination: ShellNavigationDestination];
  selectCategory: [categoryId: string];
  signOut: [];
  openAuth: [];
  openCart: [];
  openOrders: [];
}
