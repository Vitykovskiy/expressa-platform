import type { App } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";

import { router } from "./router";

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
  app.use(router);
}

export { vuetify };
