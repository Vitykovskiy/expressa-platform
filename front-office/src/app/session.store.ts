import { defineStore } from "pinia";

import { useCartStore } from "@/entities/customer/model/cart.store";
import { useOrderNotificationsStore } from "@/entities/customer/model/order-notifications.store";
import { ApiError } from "../shared/api/client";
import { isCurrentUserProfile } from "@/shared/api/auth.api";
import type { CurrentUserProfile } from "@/shared/api/auth.api.types";
import type { CompleteCustomerRegistration } from "../shared/api/customer-registration.api.types";
import {
  anonymousSessionState,
  initialSessionState,
  sessionErrorCodes,
  sessionMessages,
  sessionStatuses,
} from "./session.store.constants";
import { getSessionDependencies } from "./session.store.dependencies";
import type {
  OtpRequestMetadata,
  ProtectedReadLiveness,
  ProtectedReadRecoveryStart,
  SessionState,
} from "./session.store.types";

const logoutPromises = new WeakMap<object, Promise<void>>();

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({ ...initialSessionState }),
  getters: {
    currentProfile(state): CurrentUserProfile | null {
      if (state.status !== sessionStatuses.authenticated) {
        return null;
      }
      if (!isCurrentUserProfile(state.currentUser)) {
        throw new Error(sessionMessages.operationFailed);
      }

      return state.currentUser;
    },
  },
  actions: {
    async completeRegistration(
      name: string,
      complete: CompleteCustomerRegistration,
    ): Promise<boolean> {
      if (this.registrationPending) {
        return false;
      }
      const user = this.currentProfile;
      const accessToken = this.accessToken;
      if (
        this.status !== sessionStatuses.authenticated ||
        user === null ||
        accessToken === null
      ) {
        throw new Error(sessionMessages.completeRegistration);
      }
      if (user.name !== null) {
        return true;
      }
      const generation = this.generation;
      this.registrationPending = true;
      try {
        const registered = await complete(accessToken, name);
        if (!this.ownsProtectedRead(generation, user.id)) {
          return false;
        }
        if (
          registered.id !== user.id ||
          registered.role !== "customer" ||
          registered.phoneE164 !== user.phoneE164 ||
          registered.name === null
        ) {
          throw new Error(sessionMessages.completeRegistration);
        }
        this.currentUser = registered;
        return true;
      } catch (error) {
        if (this.ownsProtectedRead(generation, user.id)) {
          if (
            error instanceof ApiError &&
            (error.status === 401 || error.status === 403)
          ) {
            this.clear();
          }
        }
        throw error;
      } finally {
        if (this.ownsProtectedRead(generation, user.id)) {
          this.registrationPending = false;
        }
      }
    },
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
        this.otpCooldownUntil = requestedAt + metadata.retryAfterSeconds * 1000;

        return metadata;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === sessionErrorCodes.otpRateLimited &&
          error.retryAfterSeconds !== null
        ) {
          const requestedAt = getSessionDependencies().now();
          this.pendingPhone = phone;
          this.otpCooldownUntil = requestedAt + error.retryAfterSeconds * 1000;
        }
        this.errorMessage = getErrorMessage("requestOtp", error);
        throw error;
      }
    },
    async verifyOtp(phone: string, code: string): Promise<void> {
      this.errorMessage = null;
      const generation = ++this.generation;
      this.registrationPending = false;

      try {
        const accessSession = await getSessionDependencies().authApi.verifyOtp(
          phone,
          code,
        );
        await this.authenticate(accessSession.accessToken, generation);
        if (this.generation !== generation) {
          return;
        }
        this.clearOtpRequest();
      } catch (error) {
        if (this.generation === generation) {
          this.errorMessage = getErrorMessage("verifyOtp", error);
        }
        throw error;
      }
    },
    async logout(): Promise<void> {
      const activeLogout = logoutPromises.get(this);
      if (activeLogout) return activeLogout;

      this.errorMessage = null;
      const logout = this.completeLogout();
      logoutPromises.set(this, logout);

      try {
        await logout;
      } finally {
        logoutPromises.delete(this);
      }
    },
    async completeLogout(): Promise<void> {
      try {
        const pushSubscription =
          await useOrderNotificationsStore().readLogoutPushSubscription();
        const generation = ++this.generation;
        this.registrationPending = false;
        await getSessionDependencies().authApi.logout(pushSubscription);
        if (this.generation !== generation) return;
        this.clear();
        useCartStore().clear();
      } catch (error) {
        this.errorMessage = getErrorMessage(null, error);
        throw error;
      }
    },
    setAuthenticated(phone: string): void {
      this.phone = phone;
      this.status = sessionStatuses.authenticated;
    },
    clear(): void {
      const generation = this.generation + 1;
      Object.assign(this, anonymousSessionState, { generation });
    },
    async restore(): Promise<void> {
      const generation = ++this.generation;
      this.registrationPending = false;
      this.status = sessionStatuses.unknown;
      this.errorMessage = null;

      try {
        const accessSession = await getSessionDependencies().authApi.refresh();
        await this.authenticate(accessSession.accessToken, generation);
      } catch (error) {
        if (this.generation !== generation) return;
        if (isUnauthorized(error)) {
          this.clear();
          return;
        }

        this.errorMessage = getErrorMessage("restore", error);
      }
    },
    async authenticate(
      accessToken: string,
      generation?: number,
    ): Promise<void> {
      const expectedGeneration = generation ?? this.generation;
      const currentUser =
        await getSessionDependencies().authApi.getCurrentUser(accessToken);

      if (this.generation !== expectedGeneration) {
        return;
      }

      if (!isCurrentUserProfile(currentUser)) {
        throw new Error(sessionMessages.operationFailed);
      }
      if (currentUser.role !== "customer") {
        this.clear();
        throw new Error(sessionMessages.roleRejected);
      }

      this.accessToken = accessToken;
      this.currentUser = currentUser;
      this.phone = currentUser.phoneE164;
      this.status = sessionStatuses.authenticated;
    },
    async readProtected<T>(
      read: (accessToken: string) => Promise<T>,
      isLive: ProtectedReadLiveness = () => true,
      onRecoveryStart: ProtectedReadRecoveryStart = () => {},
    ): Promise<T> {
      const accessToken = this.accessToken;
      const accountId = this.currentUser?.id ?? null;
      const generation = this.generation;
      if (accessToken === null)
        throw new Error(sessionMessages.operationFailed);

      try {
        const result = await read(accessToken);
        if (!isLive() || !this.ownsProtectedRead(generation, accountId))
          throw new Error(sessionMessages.restore);
        return result;
      } catch (error) {
        if (!isUnauthorized(error)) throw error;
      }

      const sharesInFlightRefresh =
        this.restorePromise !== null &&
        this.accessToken === accessToken &&
        (this.currentUser?.id ?? null) === accountId;
      if (
        !isLive() ||
        (!this.ownsProtectedRead(generation, accountId) &&
          !sharesInFlightRefresh)
      )
        throw new Error(sessionMessages.restore);
      onRecoveryStart();
      await this.bootstrap();
      const refreshedAccessToken = this.accessToken;
      if (
        this.status !== sessionStatuses.authenticated ||
        refreshedAccessToken === null ||
        (this.currentUser?.id ?? null) !== accountId ||
        (this.generation !== generation && this.generation !== generation + 1)
      ) {
        throw new Error(sessionMessages.restore);
      }
      const refreshedGeneration = this.generation;

      try {
        if (!isLive()) throw new Error(sessionMessages.restore);
        const result = await read(refreshedAccessToken);
        if (
          !isLive() ||
          !this.ownsProtectedRead(refreshedGeneration, accountId)
        )
          throw new Error(sessionMessages.restore);
        return result;
      } catch (error) {
        if (
          isUnauthorized(error) &&
          this.ownsProtectedRead(refreshedGeneration, accountId)
        )
          this.clear();
        throw error;
      }
    },
    ownsProtectedRead(generation: number, accountId: string | null): boolean {
      return (
        this.generation === generation &&
        (this.currentUser?.id ?? null) === accountId
      );
    },
    clearOtpRequest(): void {
      this.pendingPhone = null;
      this.otpRequestMetadata = null;
      this.otpRequestedAt = null;
      this.otpExpiresAt = null;
      this.otpCooldownUntil = null;
    },
  },
});

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function getErrorMessage(
  operation: "requestOtp" | "restore" | "verifyOtp" | null,
  error: unknown,
): string {
  if (
    error instanceof ApiError &&
    error.code === sessionErrorCodes.invalidOtpCode
  ) {
    return sessionMessages.invalidOtpCode;
  }

  if (
    error instanceof ApiError &&
    error.code === sessionErrorCodes.otpRateLimited
  ) {
    return sessionMessages.otpRateLimited;
  }

  if (
    error instanceof ApiError &&
    error.code === sessionErrorCodes.expiredOtpCode
  ) {
    return sessionMessages.expiredOtpCode;
  }

  if (error instanceof ApiError && operation !== null) {
    return sessionMessages[operation];
  }

  return sessionMessages.operationFailed;
}
