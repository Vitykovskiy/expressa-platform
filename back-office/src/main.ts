import { createApp } from 'vue'
import 'vuetify/styles'

import App from './app/App.vue'
import { installPlugins } from './app/plugins'
import { registerPwa } from './app/pwa'
import { apiClientKey, createApiClient } from './shared/api/client'
import { validateEnvironment } from './shared/config/environment'

const environment = validateEnvironment(import.meta.env)

const app = createApp(App)

installPlugins(app)
app.provide(apiClientKey, createApiClient(environment.apiBaseUrl))
app.mount('#app')
registerPwa()
