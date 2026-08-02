import { createPinia } from "pinia";
import type { App } from "vue";

import { vuetify } from "../plugins/vuetify";

export function installPlugins(app: App): void {
  app.use(createPinia());
  app.use(vuetify);
}

export { vuetify };
