export type ShellNavigationDestination = "auth" | "cart" | "menu" | "orders";

export interface ShellNavigationCategory {
  id: string;
  name: string;
}

export interface ShellNavigationProps {
  activeDestination: ShellNavigationDestination;
  categories: ShellNavigationCategory[];
  cartCount: number;
  isAuthenticated: boolean;
  isLogoutPending: boolean;
  accountLabel: string;
  selectedCategoryId?: string;
}

export interface ShellNavigationEmits {
  navigate: [destination: ShellNavigationDestination];
  openAccount: [];
  selectCategory: [categoryId: string];
}

export type ShellNavigationItem = {
  destination: ShellNavigationDestination;
  label: string;
};
