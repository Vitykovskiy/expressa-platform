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
  AUTH_ACCESS_TOKEN_SECRET: "back-office-e2e-access-token-secret",
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
export const backOfficePlaywrightProjectName = {
  app: "app-e2e",
  auth: "auth-e2e",
  storybook: "storybook-e2e",
  storybookA11y: "storybook-a11y",
  storybookVisual: "storybook-visual",
} as const;
export const backOfficePlaywrightSnapshotPathTemplate =
  "{testDir}/{testFilePath}-snapshots/{arg}{ext}";
export const backOfficePlaywrightTestMatch = {
  app: /app\.e2e\.ts/,
  auth: /auth\.e2e\.ts/,
  storybook: /navigation\.e2e\.ts/,
  storybookA11y: /a11y\.e2e\.ts/,
  storybookVisual: /visual\.e2e\.ts/,
} as const;
export const backOfficePlaywrightTestDirectory = "./tests/e2e";
export const backOfficePlaywrightTrace = "on-first-retry";
export const backOfficeStorybookUrl = "http://127.0.0.1:6006";
export const backOfficeStorybookWebServerCommand =
  "npm run storybook -- --ci --host 127.0.0.1";
export const backOfficeWebServerTimeout = 120_000;
export const playwrightTargets = {
  auth: "auth",
  storybook: "storybook",
} as const;
