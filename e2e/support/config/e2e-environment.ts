import {
  E2E_ADMIN_OTP_ENVIRONMENT_VARIABLE,
  E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
  E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_OTP_ENVIRONMENT_VARIABLE,
  E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
  E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE,
  E2E_STAFF_OTP_ENVIRONMENT_VARIABLE,
  E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
} from "./e2e-environment.constants";
import type {
  E2eCredentials,
  E2eEnvironment,
  E2eOtpCredentials,
} from "./e2e-environment.types";

export function getE2eEnvironment(): E2eEnvironment {
  return {
    frontOfficeUrl: readUrl(E2E_FRONT_OFFICE_URL_ENVIRONMENT_VARIABLE),
    backOfficeUrl: readUrl(E2E_BACK_OFFICE_URL_ENVIRONMENT_VARIABLE),
  };
}

export function getE2eCredentials(): E2eCredentials {
  return {
    administrator: readOtpCredentials(
      E2E_ADMIN_PHONE_ENVIRONMENT_VARIABLE,
      E2E_ADMIN_OTP_ENVIRONMENT_VARIABLE,
    ),
    staff: readOtpCredentials(
      E2E_STAFF_PHONE_ENVIRONMENT_VARIABLE,
      E2E_STAFF_OTP_ENVIRONMENT_VARIABLE,
    ),
    customer: readOtpCredentials(
      E2E_CUSTOMER_PHONE_ENVIRONMENT_VARIABLE,
      E2E_CUSTOMER_OTP_ENVIRONMENT_VARIABLE,
    ),
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

function readOtpCredentials(
  phoneName: string,
  otpName: string,
): E2eOtpCredentials {
  const phone = readRequiredValue(phoneName);
  const otp = readRequiredValue(otpName);
  if (phone.replace(/\D/g, "").length !== 11)
    throw new Error(`${phoneName} must contain a Russian phone number.`);
  if (!/^\d{6}$/u.test(otp))
    throw new Error(`${otpName} must contain exactly six digits.`);
  return { phone, otp };
}

function readRequiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (value === undefined || value === "")
    throw new Error(`${name} is required.`);
  return value;
}
