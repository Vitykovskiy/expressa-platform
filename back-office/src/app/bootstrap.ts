import { createApp } from "vue";
import type { Component } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { VApp } from "vuetify/components/VApp";
import { normalizeLegacyEntry, recoverLegacyWorker } from "./legacy-entry";
import { LIGHT_THEME_COLORS } from "./theme.constants";
import "vuetify/styles";
import "./styles.css";

export function mountBackoffice(rootComponent: Component) {
  normalizeLegacyEntry();

  const vuetify = createVuetify({
    components: { VApp },
    theme: {
      defaultTheme: "expressaLight",
      themes: { expressaLight: { dark: false, colors: LIGHT_THEME_COLORS } },
    },
  });

  const app = createApp(rootComponent)
    .use(createPinia())
    .use(vuetify)
    .mount("#app");

  void recoverLegacyWorker();

  return app;
}
