import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3-vite";
import { vuetify } from "../src/app/plugins";
import "../src/shared/ui/tokens.css";

import "vuetify/styles";

setup((app) => {
  app.use(vuetify);
});

const preview: Preview = {
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "padded",
    viewport: {
      viewports: {
        mobile320: {
          name: "320 px",
          styles: { height: "568px", width: "320px" },
        },
        mobile390: {
          name: "390 px",
          styles: { height: "844px", width: "390px" },
        },
        breakpoint479: {
          name: "479 px",
          styles: { height: "844px", width: "479px" },
        },
        breakpoint480: {
          name: "480 px",
          styles: { height: "844px", width: "480px" },
        },
        breakpoint767: {
          name: "767 px",
          styles: { height: "1024px", width: "767px" },
        },
        tablet768: {
          name: "768 px",
          styles: { height: "1024px", width: "768px" },
        },
        breakpoint1023: {
          name: "1023 px",
          styles: { height: "1024px", width: "1023px" },
        },
        desktop1024: {
          name: "1024 px",
          styles: { height: "1024px", width: "1024px" },
        },
        desktop1280: {
          name: "1280 px",
          styles: { height: "1024px", width: "1280px" },
        },
        desktop1440: {
          name: "1440 px",
          styles: { height: "1024px", width: "1440px" },
        },
      },
    },
  },
};

export default preview;
