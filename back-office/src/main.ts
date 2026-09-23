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
import { createNotificationRuntime } from "./app/notifications/notification-runtime";
import { notificationRuntimeKey } from "./app/notifications/notification-runtime.types";
import { setOperationPort } from "./shared/lib/operations/operation-port";

const environment = validateEnvironment(import.meta.env);
const apiClient = createApiClient(environment.apiBaseUrl);
const notificationRuntime = createNotificationRuntime();
setOperationPort(notificationRuntime);

const app = createApp(App);

setSessionStoreDependencies(createSessionStoreDependencies(apiClient));
setCatalogStoreDependencies({ catalogApi: new CatalogApi(apiClient) });
installPlugins(app);
app.provide(apiClientKey, apiClient);
app.provide(notificationRuntimeKey, notificationRuntime);
app.mount("#app");
registerPwa();
