import { defineStore } from "pinia";

import { useCartStore } from "@/entities/customer/model/cart.store";
import { ApiError } from "../shared/api/client";
import {
  anonymousSessionState,
  initialSessionState,
  sessionErrorCodes,
  sessionMessages,
  sessionStatuses,
} from "./session.store.constants";
import { getSessionDependencies } from "./session.store.dependencies";
import type { OtpRequestMetadata, SessionState } from "./session.store.types";

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({ ...initialSessionState }),
  actions: {
    async bootstrap(): Promise<void> {
      if (this.restorePromise) return this.restorePromise;

      this.restorePromise = this.restore();

      try {
        await this.restorePromise;
      } finally {
        this.restorePromise = null;
      }
    },
    async requestOtp(phone: string): Promise<OtpRequestMetadata> {
      this.errorMessage = null;

      try {
        const metadata =
          await getSessionDependencies().authApi.requestOtp(phone);
        const requestedAt = getSessionDependencies().now();

        this.pendingPhone = phone;
        this.otpRequestMetadata = metadata;
        this.otpRequestedAt = requestedAt;
        this.otpExpiresAt = requestedAt + metadata.expiresInSeconds * 1000;

        return metadata;
      } catch (error) {
        this.errorMessage = getErrorMessage(error);
        throw error;
      }
    },
    async verifyOtp(phone: string, code: string): Promise<void> {
      this.errorMessage = null;

      try {
        const accessSession = await getSessionDependencies().authApi.verifyOtp(
          phone,
          code,
        );
        await this.authenticate(accessSession.accessToken);
        this.clearOtpRequest();
      } catch (error) {
        this.errorMessage = getErrorMessage(error);
        throw error;
      }
    },
    async logout(): Promise<void> {
      this.errorMessage = null;

      try {
        await getSessionDependencies().authApi.logout();
        this.clear();
        useCartStore().clear();
      } catch (error) {
        this.errorMessage = getErrorMessage(error);
        throw error;
      }
    },
    setAuthenticated(phone: string): void {
      this.phone = phone;
      this.status = sessionStatuses.authenticated;
    },
    clear(): void {
      Object.assign(this, anonymousSessionState);
    },
    async restore(): Promise<void> {
      this.status = sessionStatuses.unknown;
      this.errorMessage = null;

      try {
        const accessSession = await getSessionDependencies().authApi.refresh();
        await this.authenticate(accessSession.accessToken);
      } catch (error) {
        if (isUnauthorized(error)) {
          this.clear();
          return;
        }

        this.errorMessage = getErrorMessage(error);
      }
    },
    async authenticate(accessToken: string): Promise<void> {
      const currentUser =
        await getSessionDependencies().authApi.getCurrentUser(accessToken);

      if (currentUser.role !== "customer") {
        this.clear();
        throw new Error(sessionMessages.roleRejected);
      }

      this.accessToken = accessToken;
      this.currentUser = currentUser;
      this.phone = currentUser.phoneE164;
      this.status = sessionStatuses.authenticated;
    },
    clearOtpRequest(): void {
      this.pendingPhone = null;
      this.otpRequestMetadata = null;
      this.otpRequestedAt = null;
      this.otpExpiresAt = null;
    },
  },
});

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function getErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.code === sessionErrorCodes.invalidOtpCode
  ) {
    return sessionMessages.invalidOtpCode;
  }

  return error instanceof Error
    ? error.message
    : sessionMessages.operationFailed;
}
