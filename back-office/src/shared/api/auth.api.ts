import { ApiClient } from "./client";
import {
  authApiPaths,
  authRequestOptions,
  bearerTokenType,
} from "./auth.api.constants";
import type {
  AuthAccess,
  AuthAccessResponse,
  AuthCurrentUser,
  AuthOtpMetadata,
  AuthUserRole,
} from "./auth.api.types";

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  async requestOtp(phone: string): Promise<AuthOtpMetadata> {
    const response = await this.client.request(
      authApiPaths.requestOtp,
      isAuthOtpMetadata,
      {
        ...authRequestOptions,
        body: { phone },
        expectedStatus: 202,
        method: "POST",
      },
    );

    return {
      expiresInSeconds: response.expiresInSeconds,
      retryAfterSeconds: response.retryAfterSeconds,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthAccess> {
    const response = await this.client.request(
      authApiPaths.verifyOtp,
      isAuthAccess,
      {
        ...authRequestOptions,
        body: { code, phone },
        expectedStatus: 200,
        method: "POST",
      },
    );

    return toAuthAccess(response);
  }

  async refresh(): Promise<AuthAccess> {
    const response = await this.client.request(
      authApiPaths.refresh,
      isAuthAccess,
      {
        ...authRequestOptions,
        expectedStatus: 200,
        method: "POST",
      },
    );

    return toAuthAccess(response);
  }

  logout(): Promise<void> {
    return this.client.request(authApiPaths.logout, isUndefined, {
      ...authRequestOptions,
      expectedStatus: 204,
      method: "POST",
    });
  }

  async getCurrentUser(accessToken: string): Promise<AuthCurrentUser> {
    const response = await this.client.request(
      authApiPaths.currentUser,
      isAuthCurrentUser,
      {
        expectedStatus: 200,
        headers: createBearerHeaders(accessToken),
        method: "GET",
      },
    );

    return {
      id: response.id,
      phoneE164: response.phoneE164,
      role: response.role,
    };
  }
}

function createBearerHeaders(accessToken: string): HeadersInit {
  return { authorization: `${bearerTokenType} ${accessToken}` };
}

function isAuthOtpMetadata(value: unknown): value is AuthOtpMetadata {
  return (
    isRecord(value) &&
    isPositiveInteger(value.expiresInSeconds) &&
    isPositiveInteger(value.retryAfterSeconds)
  );
}

function isAuthAccess(value: unknown): value is AuthAccessResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    value.accessToken !== "" &&
    value.tokenType === bearerTokenType &&
    isPositiveInteger(value.expiresInSeconds)
  );
}

function toAuthAccess(value: AuthAccessResponse): AuthAccess {
  return {
    accessToken: value.accessToken,
    expiresInSeconds: value.expiresInSeconds,
  };
}

function isAuthCurrentUser(value: unknown): value is AuthCurrentUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.phoneE164 === "string" &&
    /^\+7\d{10}$/.test(value.phoneE164) &&
    isAuthUserRole(value.role)
  );
}

function isAuthUserRole(value: unknown): value is AuthUserRole {
  return (
    value === "customer" || value === "barista" || value === "administrator"
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
