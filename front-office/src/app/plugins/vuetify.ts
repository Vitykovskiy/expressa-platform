import { customerVuetifyColorAdapter } from "./vuetify.constants";
import { createVuetify } from "vuetify";

// Тема Vuetify не принимает пользовательские свойства CSS в качестве значений.
// Адаптер повторяет customer-tokens.css статическими значениями для JavaScript API Vuetify.

export const vuetify = createVuetify({
  display: {
    mobileBreakpoint: "sm",
    thresholds: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1920,
    },
  },
  theme: {
    defaultTheme: "customer",
    themes: {
      customer: {
        dark: true,
        colors: customerVuetifyColorAdapter,
      },
    },
  },
});
