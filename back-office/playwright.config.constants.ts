export const authBackendUrl = "http://127.0.0.1:3000";
export const authBackendReadyUrl = `${authBackendUrl}/docs`;
export const authFrontendUrl = "http://127.0.0.1:4175";
export const authDatabaseUrl =
  "postgresql://expressa:expressa@127.0.0.1:5433/expressa";
export const authComposeProjectName = "expressa-backoffice-e2e";
export const authOrigin = "http://127.0.0.1:4175";
export const authBackendPidPath = "/tmp/expressa-backoffice-e2e-backend.pid";
export const authBackendCommand =
  'sh -c \'set -e; rm -f /tmp/expressa-backoffice-e2e-backend.pid; docker compose -p expressa-backoffice-e2e -f ../backend/compose.local.yml -f playwright.auth.compose.yml down --volumes; docker compose -p expressa-backoffice-e2e -f ../backend/compose.local.yml -f playwright.auth.compose.yml up -d --wait; (cd ../backend && npm run migrate); (cd ../backend && exec ./node_modules/.bin/nest start) & backend_pid=$!; echo "$backend_pid" > /tmp/expressa-backoffice-e2e-backend.pid; wait "$backend_pid"\'';
export const authServerEnvironment = {
  AUTH_ACCESS_TOKEN_SECRET: "changeme-back-office-e2e-access-token-secret",
  AUTH_DEVELOPMENT_OTP: "123456",
  AUTH_OTP_PEPPER: "back-office-e2e-otp-pepper",
  CORS_ORIGINS: authOrigin,
  DATABASE_URL: authDatabaseUrl,
  NODE_ENV: "local",
  PORT: "3000",
} as const;
export const backOfficeAppUrl = "http://127.0.0.1:4173";
export const backOfficeAppWebServerCommand = "npm run preview";
export const backOfficeDesktopBrowserDeviceName = "Desktop Chrome";
export const backOfficeAuthWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3000 npm run build && npm run preview -- --port 4175";
export const catalogBackendPidPath =
  "/tmp/expressa-backoffice-catalog-e2e-backend.pid";
export const catalogBackendReadyUrl = "http://127.0.0.1:3001/docs";
export const catalogComposeProjectName = "expressa-backoffice-catalog-e2e";
export const catalogDatabaseUrl =
  "postgresql://expressa:expressa@127.0.0.1:5435/expressa";
export const catalogFrontendUrl = "http://127.0.0.1:4174";
export const catalogBackOfficeWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3001 npm run build && npm run preview -- --port 4175";
export const catalogFrontendWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3001 npm --prefix ../front-office run build && (cd ../front-office && npx vite preview --host 127.0.0.1 --port 4174)";
export const catalogOrigin = "http://127.0.0.1:4175";
export const catalogServerEnvironment = {
  AUTH_ACCESS_TOKEN_SECRET:
    "changeme-back-office-catalog-e2e-access-token-secret",
  AUTH_DEVELOPMENT_OTP: "123456",
  AUTH_OTP_PEPPER: "back-office-catalog-e2e-otp-pepper",
  CORS_ORIGINS: `${catalogOrigin},${catalogFrontendUrl}`,
  ["DATABASE_URL"]: catalogDatabaseUrl,
  NODE_ENV: "local",
  PORT: "3001",
  VAPID_SUBJECT: "mailto:push@expressa.test",
  VAPID_PUBLIC_KEY:
    "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
  VAPID_PRIVATE_KEY: "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
} as const;
export const catalogBackendCommand =
  'sh -c \'set -e; rm -f /tmp/expressa-backoffice-catalog-e2e-backend.pid; docker compose -p expressa-backoffice-catalog-e2e -f ../backend/compose.local.yml down --volumes; printf "services:\\n  postgres:\\n    ports: !override\\n      - 127.0.0.1:5435:5432\\n" | docker compose -p expressa-backoffice-catalog-e2e -f ../backend/compose.local.yml -f - up -d --wait; (cd ../backend && env DATABASE_URL=postgresql://expressa:expressa@127.0.0.1:5435/expressa AUTH_ACCESS_TOKEN_SECRET=changeme-back-office-catalog-e2e-access-token-secret AUTH_DEVELOPMENT_OTP=123456 AUTH_OTP_PEPPER=back-office-catalog-e2e-otp-pepper CORS_ORIGINS=http://127.0.0.1:4175,http://127.0.0.1:4174 NODE_ENV=local PORT=3001 npm run migrate && exec ./node_modules/.bin/nest start) & backend_pid=$!; echo "$backend_pid" > /tmp/expressa-backoffice-catalog-e2e-backend.pid; wait "$backend_pid"\'';
export const backOfficePlaywrightProjectName = {
  app: "app-e2e",
  auth: "auth-e2e",
  catalog: "catalog-e2e",
} as const;
export const backOfficePlaywrightTestMatch = {
  app: /tests\/e2e\/app\.e2e\.ts/,
  auth: /tests\/e2e\/auth\.e2e\.ts/,
  catalog: /tests\/e2e\/catalog\.e2e\.ts/,
} as const;
export const backOfficePlaywrightTestDirectory = ".";
export const backOfficePlaywrightTrace = "on-first-retry";
export const backOfficeWebServerTimeout = 120_000;
export const playwrightTargets = {
  auth: "auth",
  catalog: "catalog",
} as const;
