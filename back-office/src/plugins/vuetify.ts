import "vuetify/styles";

import { createVuetify } from "vuetify";
import { expressaAdminThemeColors } from "../styles/theme";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "expressaAdmin",
    themes: {
      expressaAdmin: {
        dark: false,
        colors: expressaAdminThemeColors,
      },
    },
  },
});
