import { createApp } from "vue";
import "vuetify/styles";
import "./shared/styles/tokens.css";
import "./shared/styles/base.css";
import App from "./app/App.vue";
import { createFoundationRuntime } from "./app/theme";

const runtime = createFoundationRuntime();
const app = createApp(App);

app.use(runtime);
app.mount("#app");

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.unmount();
    runtime.dispose();
  });
}
