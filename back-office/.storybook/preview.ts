import { setup } from "@storybook/vue3-vite";
import "vuetify/styles";
import "../src/shared/styles/tokens.css";
import "../src/shared/styles/base.css";
import "./styles.css";
import { createFoundationRuntime } from "../src/app/theme";
import { previewConfiguration } from "./preview.constants";

setup((app) => {
  app.use(createFoundationRuntime());
});

export default { ...previewConfiguration };
