export const ordersBackendOrigin = "http://127.0.0.1:3002";
export const ordersBackendReadyUrl = `${ordersBackendOrigin}/health/ready`;
export const ordersFrontendOrigin = "http://127.0.0.1:4176";
export const ordersBackOfficeOrigin = "http://127.0.0.1:4177";
export const ordersDatabaseUrl =
  "postgresql://expressa:expressa@127.0.0.1:5436/expressa";
export const ordersComposeProjectName = "expressa-orders-e2e";
export const ordersPlaywrightOutputDirectory =
  "/tmp/expressa-orders-playwright-results";
export const ordersPlaywrightTestMatch = "tests/e2e/orders.e2e.ts";
export const ordersWebServerTimeout = 120_000;
export const ordersDevelopmentOtp = "123456";
export const ordersCustomerPhonePrefix = "+7995";
export const ordersStaffPhonePrefix = "+7994";
export const ordersAdministratorPhonePrefix = "+7993";
export const ordersCategoryName = "Кофе";
export const ordersProductName = "Капучино";
export const ordersUnifiedProductName = "Q-E2E капучино";
export const ordersAccessTokenSecret = "orders-e2e-access-token-secret";
export const ordersOtpPepper = "orders-e2e-otp-pepper";
export const ordersVapidSubject = "mailto:push@expressa.test";
export const ordersVapidPublicKey =
  "BOT-VsrivTqPsMDCzS45APlNSMbgcTT5jqlrYu2-6PCRGB0YneXQDNsbrIxTAy0jJ-kUlKlWPm94PeirK8A8wCw";
export const ordersVapidPrivateKey =
  "9rZGGVplNbc2psiiiyOla_ZL-qDyrgIZqD_cpLz1G0c";

const ordersBackendEnvironment = [
  "NODE_ENV=local",
  "PORT=3002",
  `DATABASE_URL=${ordersDatabaseUrl}`,
  `AUTH_ACCESS_TOKEN_SECRET=${ordersAccessTokenSecret}`,
  `AUTH_OTP_PEPPER=${ordersOtpPepper}`,
  `AUTH_DEVELOPMENT_OTP=${ordersDevelopmentOtp}`,
  `VAPID_SUBJECT=${ordersVapidSubject}`,
  `VAPID_PUBLIC_KEY=${ordersVapidPublicKey}`,
  `VAPID_PRIVATE_KEY=${ordersVapidPrivateKey}`,
  `CORS_ORIGINS=${ordersFrontendOrigin},${ordersBackOfficeOrigin}`,
].join(" ");
const ordersComposeCommand = `docker compose -p ${ordersComposeProjectName} -f ../backend/compose.local.yml`;
const ordersComposeOverride = `services:
  postgres:
    ports: !override
      - 127.0.0.1:5436:5432
`;

export const ordersBackendCommand = `sh -c 'set -eu
cleanup() {
  if [ -n "\${backend_pid:-}" ]; then
    kill "\${backend_pid}" 2>/dev/null || true
    wait "\${backend_pid}" 2>/dev/null || true
  fi
  ${ordersComposeCommand} down --volumes
}
trap cleanup EXIT INT TERM
${ordersComposeCommand} down --volumes
printf %s "${ordersComposeOverride}" | ${ordersComposeCommand} -f - up -d --wait
(
  cd ../backend
  env ${ordersBackendEnvironment} npm run migrate
  env ${ordersBackendEnvironment} npm run seed
  env ${ordersBackendEnvironment} npm run start
) &
backend_pid=$!
wait "$backend_pid"'`;

export const ordersFrontendWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3002 npm --prefix ../front-office run build && (cd ../front-office && npx vite preview --host 127.0.0.1 --port 4176)";
export const ordersBackOfficeWebServerCommand =
  "VITE_APP_ENV=local VITE_API_BASE_URL=http://127.0.0.1:3002 npm run build && npm run preview -- --port 4177";
