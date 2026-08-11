import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3-vite";

import { vuetify } from "../src/app/plugins/vuetify";
import "../src/styles/main.css";
import "./preview.css";

setup((app) => {
  app.use(vuetify);
});

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        phone320: {
          name: "Телефон 320",
          styles: { height: "900px", width: "320px" },
          type: "mobile",
        },
        phone390: {
          name: "Телефон 390",
          styles: { height: "900px", width: "390px" },
          type: "mobile",
        },
        phone479: {
          name: "Телефон 479",
          styles: { height: "900px", width: "479px" },
          type: "mobile",
        },
        phone480: {
          name: "Телефон 480",
          styles: { height: "900px", width: "480px" },
          type: "mobile",
        },
        tablet767: {
          name: "Планшет 767",
          styles: { height: "900px", width: "767px" },
          type: "tablet",
        },
        tablet768: {
          name: "Планшет 768",
          styles: { height: "900px", width: "768px" },
          type: "tablet",
        },
        desktop1023: {
          name: "Рабочий 1023",
          styles: { height: "900px", width: "1023px" },
          type: "desktop",
        },
        desktop1024: {
          name: "Рабочий 1024",
          styles: { height: "900px", width: "1024px" },
          type: "desktop",
        },
        workspace: {
          name: "Рабочий 1280",
          styles: { height: "900px", width: "1280px" },
          type: "desktop",
        },
        wide: {
          name: "Широкий 1440",
          styles: { height: "900px", width: "1440px" },
          type: "desktop",
        },
      },
    },
  },
};

export default preview;
