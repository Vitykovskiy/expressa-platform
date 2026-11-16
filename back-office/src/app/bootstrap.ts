import {
  BOOTSTRAP_FAILURE,
  ROUTER_OVERLAY_DEFAULTS,
  LIGHT_THEME_COLORS,
} from "./bootstrap.constants";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { VApp } from "vuetify/components/VApp";
import "vuetify/styles";
import "./styles.css";

// Историей владеет Vue Router: Back не закрывает редактор и не отменяет переход.

export async function mountBackoffice() {
  const vuetify = createVuetify({
    defaults: ROUTER_OVERLAY_DEFAULTS,
    components: { VApp },
    theme: {
      defaultTheme: "expressaLight",
      themes: { expressaLight: { dark: false, colors: LIGHT_THEME_COLORS } },
    },
  });

  const app = createApp(App).use(createPinia()).use(vuetify).use(router);

  try {
    await router.isReady();
    app.mount("#app");
  } catch {
    const root = globalThis.document.getElementById("app");

    root?.replaceChildren(
      globalThis.document.createTextNode(BOOTSTRAP_FAILURE),
    );
  }
}
