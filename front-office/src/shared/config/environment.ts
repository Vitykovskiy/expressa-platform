type ApplicationEnvironment =
  "local" | "development" | "staging" | "production";

type EnvironmentSource = Pick<
  ImportMetaEnv,
  "VITE_APP_ENV" | "VITE_API_BASE_URL"
>;

export interface EnvironmentConfig {
  apiBaseUrl: string;
}

const applicationEnvironments: readonly ApplicationEnvironment[] = [
  "local",
  "development",
  "staging",
  "production",
];

function requireEnvironmentValue(
  value: string | undefined,
  variableName: string,
): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Неверная конфигурация: ${variableName} обязательна.`);
  }

  return value;
}

function validateApplicationEnvironment(
  value: string,
): asserts value is ApplicationEnvironment {
  if (!applicationEnvironments.some((environment) => environment === value)) {
    throw new Error(
      "Неверная конфигурация: VITE_APP_ENV должна быть local, development, staging или production.",
    );
  }
}

function validateApiBaseUrl(value: string): void {
  if (value === "/") {
    return;
  }

  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.username !== "" ||
      url.password !== ""
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "Неверная конфигурация: VITE_API_BASE_URL должна быть / или абсолютным HTTP(S) URL origin.",
    );
  }
}

export function validateEnvironment(
  environment: EnvironmentSource,
): EnvironmentConfig {
  const applicationEnvironment = requireEnvironmentValue(
    environment.VITE_APP_ENV,
    "VITE_APP_ENV",
  );
  const apiBaseUrl = requireEnvironmentValue(
    environment.VITE_API_BASE_URL,
    "VITE_API_BASE_URL",
  );

  validateApplicationEnvironment(applicationEnvironment);
  validateApiBaseUrl(apiBaseUrl);

  return { apiBaseUrl };
}
