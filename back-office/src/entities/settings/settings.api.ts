import { requestApi } from "../../shared/api/request";
import { parseApiHttpError } from "../../shared/api/http-error";
import { SETTINGS_ENDPOINT } from "./settings.constants";
import { parseSettingsDto } from "./settings.dto";
import { mapSettings, sameSettings } from "./settings.mapper";
import type {
  SettingsInput,
  SettingsReadOutcome,
  SettingsSaveOutcome,
} from "./settings.types";

export async function readSettings(
  accessToken: string,
  signal: AbortSignal,
): Promise<SettingsReadOutcome> {
  const result = await requestApi(SETTINGS_ENDPOINT, {
    method: "GET",
    accessToken,
    signal,
  });

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "aborted") {
    return { kind: "cancelled" };
  }

  if (result.kind !== "http" || result.status !== 200) {
    return { kind: "failed" };
  }

  const dto = parseSettingsDto(result.body);

  return dto === null
    ? { kind: "failed" }
    : { kind: "loaded", settings: mapSettings(dto) };
}

export async function saveSettings(
  accessToken: string,
  input: SettingsInput,
  signal: AbortSignal,
): Promise<SettingsSaveOutcome> {
  const result = await requestApi(SETTINGS_ENDPOINT, {
    method: "PUT",
    accessToken,
    signal,
    body: input,
  });

  if ("status" in result && (result.status === 401 || result.status === 403)) {
    return { kind: "session-expired" };
  }

  if (result.kind === "configuration-error") {
    return { kind: "not-sent" };
  }

  if (result.kind !== "http") {
    return { kind: "unknown" };
  }

  if (
    result.status === 400 &&
    parseApiHttpError(result.body)?.code === "VALIDATION_ERROR"
  ) {
    return { kind: "rejected" };
  }

  const dto = result.status === 200 ? parseSettingsDto(result.body) : null;

  return dto !== null && sameSettings(dto, input)
    ? { kind: "confirmed", settings: mapSettings(dto) }
    : { kind: "unknown" };
}
