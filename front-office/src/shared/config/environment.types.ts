export type ApplicationEnvironment =
  "local" | "development" | "staging" | "production";

export type EnvironmentSource = Pick<
  ImportMetaEnv,
  "VITE_APP_ENV" | "VITE_API_BASE_URL"
>;

export interface EnvironmentConfig {
  apiBaseUrl: string;
}
