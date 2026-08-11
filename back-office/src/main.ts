import { createApp } from "vue";
import "vuetify/styles";

import "./styles/main.css";

import App from "./app/App.vue";
import { installPlugins } from "./app/plugins";
import { registerPwa } from "./app/pwa";
import {
  createSessionStoreDependencies,
  setSessionStoreDependencies,
} from "./app/session.store.dependencies";
import { setCatalogStoreDependencies } from "./pages/admin/menu/catalog.dependencies";
import { CatalogApi } from "./shared/api/catalog.api";
import { apiClientKey, createApiClient } from "./shared/api/client";
import { validateEnvironment } from "./shared/config/environment";

const environment = validateEnvironment(import.meta.env);
const apiClient = createApiClient(environment.apiBaseUrl);

const app = createApp(App);

setSessionStoreDependencies(createSessionStoreDependencies(apiClient));
setCatalogStoreDependencies({ catalogApi: new CatalogApi(apiClient) });
installPlugins(app);
app.provide(apiClientKey, apiClient);
app.mount("#app");
registerPwa();
