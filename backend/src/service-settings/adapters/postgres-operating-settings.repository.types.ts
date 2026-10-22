import type { Pool } from "pg";
export type OperatingSettingsDatabaseRow = Record<string, unknown>;
export type OperatingSettingsPool = Pick<Pool, "query" | "connect">;
