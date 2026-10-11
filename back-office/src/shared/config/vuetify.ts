import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import { ru } from "vuetify/locale";
import { themeColors } from "./theme.constants";

export function createFoundationVuetify() {
  return createVuetify({
    locale: { locale: "ru", messages: { ru } },
    icons: { defaultSet: "mdi", aliases, sets: { mdi } },
    theme: {
      defaultTheme: "light",
      themes: {
        light: {
          dark: false,
          colors: {
            ...themeColors.light,
            error: themeColors.light.danger,
            "on-surface": themeColors.light.foreground,
            "on-background": themeColors.light.foreground,
          },
        },
        dark: {
          dark: true,
          colors: {
            ...themeColors.dark,
            error: themeColors.dark.danger,
            "on-surface": themeColors.dark.foreground,
            "on-background": themeColors.dark.foreground,
          },
        },
      },
    },
  });
}
