/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string | undefined
  readonly VITE_API_BASE_URL: string | undefined
}
