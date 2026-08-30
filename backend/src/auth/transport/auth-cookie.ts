import {
  refreshCookieName,
  refreshCookiePath,
} from "./auth.controller.constants";
import { shouldUseSecureCookies } from "../../platform/config/environment";
import type {
  AuthCookieOptions,
  AuthCookieResponse,
} from "./auth.controller.types";

export function readRefreshCookie(value: string | undefined): string | null {
  if (
    value === undefined ||
    value === "" ||
    value.includes(",") ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return null;
  }

  let refreshToken: string | null = null;

  for (const part of value.split(";")) {
    const item = part.trim();
    const separator = item.indexOf("=");

    if (
      separator <= 0 ||
      separator !== item.lastIndexOf("=") ||
      separator === item.length - 1
    ) {
      return null;
    }

    const name = item.slice(0, separator);
    const cookieValue = item.slice(separator + 1);
    if (/\s/.test(name) || /\s/.test(cookieValue)) {
      return null;
    }

    if (name === refreshCookieName) {
      if (refreshToken !== null || !isRefreshToken(cookieValue)) {
        return null;
      }

      refreshToken = cookieValue;
    }
  }

  return refreshToken;
}

export function writeRefreshCookie(
  response: AuthCookieResponse,
  refreshToken: string,
  maxAge: number,
): void {
  response.cookie(
    refreshCookieName,
    refreshToken,
    createRefreshCookieOptions(maxAge),
  );
}

export function clearRefreshCookie(response: AuthCookieResponse): void {
  response.cookie(refreshCookieName, "", createRefreshCookieOptions(0));
}

function createRefreshCookieOptions(maxAge: number): AuthCookieOptions {
  return {
    httpOnly: true,
    maxAge,
    path: refreshCookiePath,
    sameSite: "strict",
    secure: shouldUseSecureCookies(process.env.NODE_ENV),
  };
}

function isRefreshToken(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[A-Za-z0-9_-]+$/i.test(
      value,
    ) &&
    Buffer.from(value.slice(value.indexOf(".") + 1), "base64url").length === 32
  );
}
