import { createPinia } from "pinia";
import type { App } from "vue";
import { createVuetify } from "vuetify";

import "../shared/ui/tokens.css";

const vuetify = createVuetify({
  theme: {
    defaultTheme: "expressa",
    themes: {
      expressa: {
        colors: {
          primary: "#6f4e37",
        },
        dark: false,
      },
    },
  },
});

export function installPlugins(app: App): void {
  app.use(createPinia());
  app.use(vuetify);
}

export { vuetify };
