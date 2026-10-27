import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { VApp } from "vuetify/components/VApp";
import "vuetify/styles";
import "./styles.css";

const BOOTSTRAP_FAILURE = "Не удалось открыть приложение. Обновите страницу.";

// Историей владеет Vue Router: Back не закрывает редактор и не отменяет переход.
const ROUTER_OVERLAY_DEFAULTS = {
  VDialog: { closeOnBack: false },
  VMenu: { closeOnBack: false },
} as const;

const LIGHT_THEME_COLORS = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  "on-background": "#111111",
  "on-surface": "#111111",
  primary: "#1A1AFF",
  "on-primary": "#FFFFFF",
  error: "#D32F2F",
  "foreground-muted": "#555555",
  border: "#E0E0E0",
};

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
