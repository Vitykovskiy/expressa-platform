import { defineStore } from "pinia";

import { ApiError } from "../shared/api/client";
import {
  getOperationPort,
  type OperationContext,
  type OperationResult,
} from "../shared/lib/operations/operation-port";
import { getSessionStoreDependencies } from "./session.store.dependencies";
import { sessionErrorMessage, staffRoles } from "./session.store.constants";
import type {
  SessionStoreDependencies,
  SessionStoreState,
  StaffSessionUser,
} from "./session.store.types";
import type { AuthCurrentUser } from "../shared/api/auth.api.types";

export function createSessionStore(dependencies: SessionStoreDependencies) {
  let restorePromise: Promise<void> | null = null;
  let sessionEpoch = crypto.randomUUID();
  const operationContext = (
    operationKey: string,
    resourceKey: string,
    kind: OperationContext["kind"],
    fieldTargets?: OperationContext["fieldTargets"],
  ): OperationContext => ({
    attemptId: crypto.randomUUID(),
    epoch: sessionEpoch,
    fieldTargets,
    kind,
    operationKey,
    origin: kind === "read" ? "automatic" : "user",
    resourceKey,
  });

  return defineStore("session", {
    state: (): SessionStoreState => ({
      accessToken: null,
      currentUser: null,
      error: null,
      otpRetryAfterSeconds: null,
      status: "unknown",
    }),
    actions: {
      async requestOtp(phone: string) {
        const result = await getOperationPort().run(
          operationContext("auth.otp.request", "otp", "mutation", {
            phone: { path: "phone" },
          }),
          () => dependencies.authApi.requestOtp(phone),
        );
        if (result.status === "success") {
          this.error = null;
          this.otpRetryAfterSeconds = null;
          return result.value;
        }
        if (result.status !== "cancelled") {
          const error = "error" in result ? result.error : null;
          this.otpRetryAfterSeconds =
            error instanceof ApiError && error.code === "AUTH_RATE_LIMITED"
              ? error.retryAfterSeconds
              : null;
          this.applyFieldFailure(result);
        }
        return null;
      },

      async verifyOtp(phone: string, code: string): Promise<void> {
        const result = await getOperationPort().run(
          operationContext("auth.otp.verify", "otp", "mutation", {
            code: { path: "code" },
          }),
          () => dependencies.authApi.verifyOtp(phone, code),
        );
        if (result.status === "success") {
          const access = result.value;
          const userResult = await getOperationPort().run(
            operationContext("auth.current-user", "session", "read"),
            () => dependencies.authApi.getCurrentUser(access.accessToken),
          );
          if (userResult.status !== "success") return;
          await this.completeAuthentication(
            access.accessToken,
            userResult.value,
          );
          return;
        }
        if (result.status !== "cancelled") this.applyFieldFailure(result);
      },

      restore(): Promise<void> {
        if (restorePromise !== null) {
          return restorePromise;
        }

        restorePromise = (async () => {
          try {
            const access = await dependencies.authApi.refresh();
            const user = await dependencies.authApi.getCurrentUser(
              access.accessToken,
            );
            await this.completeAuthentication(access.accessToken, user);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              this.setAnonymous();
              return;
            }
            await getOperationPort().run(
              operationContext("session.restore", "session", "read"),
              () => Promise.reject(error),
            );
            this.setAnonymous();
          }
        })().finally(() => {
          restorePromise = null;
        });

        return restorePromise;
      },

      async readWithRecovery<T>(
        read: (accessToken: string) => Promise<T>,
      ): Promise<T> {
        const initialToken = this.accessToken;
        if (initialToken === null)
          throw new ApiError({
            code: "UNAUTHORIZED",
            details: null,
            message: sessionErrorMessage,
            requestId: null,
            status: 401,
          });
        try {
          return await read(initialToken);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          await this.restore();
          const refreshedToken = this.accessToken;
          if (refreshedToken === null) throw error;
          return read(refreshedToken);
        }
      },

      async logout(): Promise<void> {
        const result = await getOperationPort().run(
          operationContext("session.logout", "session", "mutation"),
          () => dependencies.authApi.logout(),
        );
        if (result.status === "success") {
          this.setAnonymous();
        }
      },

      async completeAuthentication(
        accessToken: string,
        user: AuthCurrentUser,
      ): Promise<void> {
        if (isStaffUser(user)) {
          this.accessToken = accessToken;
          this.currentUser = user;
          this.error = null;
          this.status = "authenticated";
          return;
        }

        await getOperationPort().run(
          operationContext("session.denied.logout", "session", "mutation"),
          () => dependencies.authApi.logout(),
        );

        this.accessToken = null;
        this.currentUser = null;
        this.status = "denied";
      },

      applyFieldFailure(result: OperationResult<unknown>): void {
        this.error =
          result.status === "fieldValidation" && result.fields[0] !== undefined
            ? { message: result.fields[0].message }
            : null;
      },

      setAnonymous(): void {
        getOperationPort().clearSession(sessionEpoch);
        sessionEpoch = crypto.randomUUID();
        this.accessToken = null;
        this.currentUser = null;
        this.error = null;
        this.otpRetryAfterSeconds = null;
        this.status = "anonymous";
      },
    },
  });
}

export const useSessionStore = createSessionStore(
  getSessionStoreDependencies(),
);

function isStaffUser(value: AuthCurrentUser): value is StaffSessionUser {
  return staffRoles.some((role) => role === value.role);
}
