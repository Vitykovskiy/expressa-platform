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
  accountLabel: string;
  selectedCategoryId?: string;
  showBack: boolean;
}

export interface ShellNavigationEmits {
  back: [];
  navigate: [destination: ShellNavigationDestination];
  selectCategory: [categoryId: string];
  signOut: [];
}

export type ShellNavigationItem = {
  destination: ShellNavigationDestination;
  label: string;
};
