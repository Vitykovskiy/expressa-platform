import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    proxy: {
      "/api/v2": process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/app",
      filename: "push-notifications.ts",
      registerType: "prompt",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Экспресса",
        short_name: "Экспресса",
        theme_color: "#1847e8",
        background_color: "#1847e8",
        display: "standalone",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "tests/e2e/**", "scripts/**/*.spec.mjs"],
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
  },
});
