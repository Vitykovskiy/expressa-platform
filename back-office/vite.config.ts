import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import {
  API_PROXY_TARGET,
  DEVELOPMENT_HOST,
  DEVELOPMENT_PORT,
} from "./vite.config.constants";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: DEVELOPMENT_HOST,
    port: DEVELOPMENT_PORT,
    strictPort: true,
    proxy: { "/api": { target: API_PROXY_TARGET, changeOrigin: false } },
  },
});
