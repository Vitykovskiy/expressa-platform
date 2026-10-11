import { watch } from "vue";
import { useGlobals } from "storybook/preview-api";
import type { Decorator } from "@storybook/vue3-vite";
import FoundationSurface from "../src/app/FoundationSurface.vue";
import { useThemePreference } from "../src/app/theme";

export function withFoundation(
  story: Parameters<Decorator>[0],
  context: Parameters<Decorator>[1],
) {
  const [, updateGlobals] = useGlobals();

  return {
    components: { story, FoundationSurface },
    setup() {
      const theme = useThemePreference();

      watch(
        () => context.globals.theme,
        (value) => {
          if (value === "light" || value === "dark") {
            theme.select(value);
          } else if (value === "system") {
            theme.followSystem();
          }
        },
        { immediate: true },
      );
      watch(
        theme.choice,
        (value) => {
          updateGlobals({ theme: value });
        },
        { immediate: true },
      );

      return {};
    },
    template: "<FoundationSurface><story /></FoundationSurface>",
  };
}
