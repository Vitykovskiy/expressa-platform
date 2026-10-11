import type { App, DeepReadonly, Ref } from "vue";
import type { ThemeMode } from "../shared/config/theme.types";
import type { createFoundationVuetify } from "../shared/config/vuetify";

export type ThemeChoice = ThemeMode | "system";

export interface ThemePreference {
  mode: DeepReadonly<Ref<ThemeMode>>;
  choice: DeepReadonly<Ref<ThemeChoice>>;
  select: (mode: ThemeMode) => void;
  followSystem: () => void;
}

export interface FoundationRuntime {
  install: (app: App) => void;
  dispose: () => void;
  theme: ThemePreference;
  vuetify: ReturnType<typeof createFoundationVuetify>;
}
