import { inject, readonly, shallowRef } from "vue";
import { createPinia } from "pinia";
import { createFoundationVuetify } from "../shared/config/vuetify";
import type { ThemeMode } from "../shared/config/theme.types";
import { themeKey, themeMediaQuery, themeStorageKey } from "./theme.constants";
import type { FoundationRuntime, ThemeChoice } from "./theme.types";

export function createFoundationRuntime(): FoundationRuntime {
  const vuetify = createFoundationVuetify();
  const media = window.matchMedia(themeMediaQuery);
  const mode = shallowRef<ThemeMode>(media.matches ? "dark" : "light");
  const choice = shallowRef<ThemeChoice>("system");

  function apply(value: ThemeMode) {
    mode.value = value;
    vuetify.theme.change(value);
    document.documentElement.style.colorScheme = value;
  }

  function select(value: ThemeMode) {
    choice.value = value;
    apply(value);

    try {
      window.localStorage.setItem(themeStorageKey, value);
    } catch {
      // A blocked storage backend must not block this runtime's explicit choice.
    }
  }

  function followSystem() {
    choice.value = "system";
    apply(media.matches ? "dark" : "light");

    try {
      window.localStorage.removeItem(themeStorageKey);
    } catch {
      // System following still works when persistence is unavailable.
    }
  }

  function onSystemChange() {
    if (choice.value === "system") {
      apply(media.matches ? "dark" : "light");
    }
  }

  try {
    const stored = window.localStorage.getItem(themeStorageKey);

    if (stored === "light" || stored === "dark") {
      choice.value = stored;
      apply(stored);
    } else {
      apply(mode.value);
    }
  } catch {
    apply(mode.value);
  }

  media.addEventListener("change", onSystemChange);

  const theme = {
    mode: readonly(mode),
    choice: readonly(choice),
    select,
    followSystem,
  };

  return {
    vuetify,
    theme,
    install(app) {
      app.use(vuetify);
      app.use(createPinia());
      app.provide(themeKey, theme);
      app.onUnmount(() => media.removeEventListener("change", onSystemChange));
    },
    dispose: () => media.removeEventListener("change", onSystemChange),
  };
}

export function useThemePreference() {
  const theme = inject(themeKey);

  if (!theme) {
    throw new Error(
      "Foundation runtime must be installed before rendering UI.",
    );
  }

  return theme;
}
