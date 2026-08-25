import {
  E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE,
} from "./e2e-environment.constants";
import type { E2eEnvironment } from "./e2e-environment.types";

export function getE2eEnvironment(): E2eEnvironment {
  return {
    frontOfficeUrl: readUrl(E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE),
    backOfficeUrl: readUrl(E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE),
  };
}

function readUrl(name: string): string {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`${name} is required.`);
  }

  if (value.trim() === "") {
    throw new Error(`${name} must not be empty.`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use the HTTP or HTTPS protocol.`);
  }

  if (url.username !== "" || url.password !== "") {
    throw new Error(`${name} must not contain credentials.`);
  }

  if (url.search !== "" || url.hash !== "") {
    throw new Error(`${name} must not contain query parameters or a fragment.`);
  }

  return url.toString();
}
