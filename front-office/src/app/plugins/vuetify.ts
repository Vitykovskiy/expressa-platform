import { createVuetify } from "vuetify";

// CSS custom properties are not valid Vuetify theme values. This adapter mirrors
// customer-tokens.css with static, parseable values for Vuetify's JavaScript API.
const customerVuetifyColorAdapter = {
  background: "#F6F7FB",
  surface: "#FFFFFF",
  "surface-subtle": "#E0EAFF",
  primary: "#1847E8",
  secondary: "#1340D0",
  error: "#D4183D",
  success: "#00A854",
  warning: "#CC8800",
  info: "#1847E8",
  brand: "#1847E8",
  "brand-raised": "#1340D0",
  "action-primary": "#1847E8",
  "text-on-brand": "#FFFFFF",
  "text-on-surface": "#0F2880",
  "text-muted-on-brand": "#536176",
  "text-muted-on-surface": "#536176",
  "border-on-brand": "#C5CCDB",
  focus: "#1847E8",
  "on-background": "#0F2880",
  "on-surface": "#0F2880",
  "on-primary": "#FFFFFF",
  "on-secondary": "#FFFFFF",
  "on-success": "#FFFFFF",
  "on-warning": "#0F2880",
  "on-error": "#FFFFFF",
  "on-info": "#FFFFFF",
} as const;

export const vuetify = createVuetify({
  display: {
    mobileBreakpoint: "sm",
    thresholds: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1920,
    },
  },
  theme: {
    defaultTheme: "customer",
    themes: {
      customer: {
        dark: false,
        colors: customerVuetifyColorAdapter,
      },
    },
  },
});
