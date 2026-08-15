export const frontOfficeAppOrigin = "http://127.0.0.1:4174";
export const frontOfficeBackendReadyUrl = "http://127.0.0.1:3000/health/ready";
export const frontOfficeBackendGracefulShutdown = {
  signal: "SIGTERM",
  timeout: 30_000,
} as const;
export const frontOfficeE2eComposeProjectName = "expressa-frontoffice-e2e";
export const frontOfficeE2eDatabaseUrl =
  "postgresql://expressa:expressa@127.0.0.1:5434/expressa";
export const frontOfficeMobileViewport = { height: 844, width: 390 };
export const frontOfficePlaywrightOutputDirectory =
  "/tmp/expressa-front-office-playwright-results";
export const frontOfficePlaywrightTestDirectory = {
  root: ".",
} as const;
export const frontOfficePlaywrightTestMatch = "tests/e2e/**/*.spec.ts";
export const frontOfficeAppWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3000 npm run build && vite preview --host 127.0.0.1 --port 4174";

const frontOfficeE2eComposeCommand = `docker compose -p ${frontOfficeE2eComposeProjectName} -f ../backend/compose.local.yml`;
const frontOfficeE2eComposeOverride = `services:
  postgres:
    ports: !override
      - 127.0.0.1:5434:5432
`;
const frontOfficeE2eBackendEnvironment = [
  "NODE_ENV=local",
  "PORT=3000",
  `DATABASE_URL=${frontOfficeE2eDatabaseUrl}`,
  "AUTH_ACCESS_TOKEN_SECRET=front-office-e2e-access-token-secret",
  "AUTH_OTP_PEPPER=front-office-e2e-otp-pepper",
  "AUTH_DEVELOPMENT_OTP=123456",
  "VAPID_SUBJECT=mailto:push@expressa.test",
  "VAPID_PUBLIC_KEY=BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw",
  "VAPID_PRIVATE_KEY=9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c",
  `CORS_ORIGINS=${frontOfficeAppOrigin}`,
].join(" ");

export const frontOfficeAuthBackendCommand = `sh -c 'set -eu
cleanup() {
  if [ -n "\${backend_pid:-}" ]; then
    kill "\${backend_pid}" 2>/dev/null || true
    wait "\${backend_pid}" 2>/dev/null || true
  fi
  ${frontOfficeE2eComposeCommand} down --volumes
}
trap cleanup EXIT INT TERM
${frontOfficeE2eComposeCommand} down --volumes
printf %s "${frontOfficeE2eComposeOverride}" | ${frontOfficeE2eComposeCommand} -f - up -d --wait
(
  cd ../backend
  env ${frontOfficeE2eBackendEnvironment} npm run migrate
  env ${frontOfficeE2eBackendEnvironment} npm run seed
  env ${frontOfficeE2eBackendEnvironment} npm run start
) &
backend_pid=$!
wait "$backend_pid"'`;
