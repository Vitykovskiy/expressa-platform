import { createApp } from "vue";
import "vuetify/styles";

import App from "./app/App.vue";
import { installPlugins } from "./app/plugins";
import { registerPwa } from "./app/pwa";
import { router } from "./app/router";
import { configureSessionDependencies } from "./app/session.store.dependencies";
import { configureMenuStoreDependencies } from "./entities/customer/model/menu.store.dependencies";
import { configureCheckoutStoreDependencies } from "./features/checkout/checkout.store.dependencies";
import { apiClientKey, createApiClient } from "./shared/api/client";
import { validateEnvironment } from "./shared/config/environment";
import "./styles/main.css";

const environment = validateEnvironment(import.meta.env);
const apiClient = createApiClient(environment.apiBaseUrl);

configureSessionDependencies(apiClient);
configureMenuStoreDependencies(apiClient);
configureCheckoutStoreDependencies(apiClient);

const app = createApp(App);

installPlugins(app);
app.use(router);
app.provide(apiClientKey, apiClient);

app.mount("#app");
registerPwa();
