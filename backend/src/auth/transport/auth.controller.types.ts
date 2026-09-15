export type AuthCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: "/api/v2/auth";
  sameSite: "strict";
  secure: boolean;
};

export type AuthCookieResponse = {
  cookie(name: string, value: string, options: AuthCookieOptions): unknown;
  status?(statusCode: number): unknown;
};

export type AuthErrorResponse = {
  code: "SERVICE_UNAVAILABLE";
  details: null;
  message: "Service unavailable";
  requestId: string;
};

export type AuthRequest = Request & { requestId?: string };

export type AuthHeaderResponse = AuthCookieResponse & {
  header(name: string, value: string): unknown;
};

export type AccessTokenResponse = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
};
import type { Request } from "express";
