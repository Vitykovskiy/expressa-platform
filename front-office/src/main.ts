import { createApp } from 'vue'
import 'vuetify/styles'

import App from './app/App.vue'
import { installPlugins } from './app/plugins'

const app = createApp(App)

installPlugins(app)
app.mount('#app')
