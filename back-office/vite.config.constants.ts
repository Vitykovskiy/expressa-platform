import vue from "@vitejs/plugin-vue";
import type { UserConfig } from "vite";

export const viteConfiguration: UserConfig = {
  plugins: [vue()],
  worker: {
    format: "es",
    rolldownOptions: { output: { entryFileNames: "staff-push-worker.js" } },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: false,
      },
    },
  },
};
