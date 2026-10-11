import type { InjectionKey } from "vue";
import type { ThemePreference } from "./theme.types";

export const themeKey: InjectionKey<ThemePreference> =
  Symbol("back-office-theme");
export const themeStorageKey = "expressa-back-office-theme";
export const themeMediaQuery = "(prefers-color-scheme: dark)";
export const themeOptions = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
] as const;
