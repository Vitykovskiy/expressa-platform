import type { App } from "vue";
import { createPinia } from "pinia";

import { vuetify } from "./plugins/vuetify";
import { router } from "./router";

export function installPlugins(app: App): void {
  app.use(createPinia());
  app.use(vuetify);
  app.use(router);
}

export { vuetify };
