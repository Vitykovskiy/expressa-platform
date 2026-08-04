import { defineStore } from "pinia";

import { ApiError } from "../shared/api/client";
import { getSessionStoreDependencies } from "./session.store.dependencies";
import { sessionErrorMessage, staffRoles } from "./session.store.constants";
import type {
  SessionStoreDependencies,
  SessionStoreError,
  SessionStoreState,
  StaffSessionUser,
} from "./session.store.types";
import type { AuthCurrentUser } from "../shared/api/auth.api.types";

export function createSessionStore(dependencies: SessionStoreDependencies) {
  let restorePromise: Promise<void> | null = null;

  return defineStore("session", {
    state: (): SessionStoreState => ({
      accessToken: null,
      currentUser: null,
      error: null,
      status: "unknown",
    }),
    actions: {
      async requestOtp(phone: string) {
        try {
          const metadata = await dependencies.authApi.requestOtp(phone);

          this.error = null;
          return metadata;
        } catch (error) {
          this.handleApiFailure(error);
          return null;
        }
      },

      async verifyOtp(phone: string, code: string): Promise<void> {
        try {
          const access = await dependencies.authApi.verifyOtp(phone, code);
          const user = await dependencies.authApi.getCurrentUser(
            access.accessToken,
          );

          await this.completeAuthentication(access.accessToken, user);
        } catch (error) {
          this.handleApiFailure(error);
        }
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
            this.handleApiFailure(error);
          }
        })().finally(() => {
          restorePromise = null;
        });

        return restorePromise;
      },

      async logout(): Promise<void> {
        try {
          await dependencies.authApi.logout();
          this.setAnonymous();
        } catch (error) {
          this.handleApiFailure(error);
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

        try {
          await dependencies.authApi.logout();
        } catch (error) {
          this.error = toSessionStoreError(error);
        }

        this.accessToken = null;
        this.currentUser = null;
        this.status = "denied";
      },

      handleApiFailure(error: unknown): void {
        if (error instanceof ApiError && error.status === 401) {
          this.setAnonymous();
          return;
        }

        this.error = toSessionStoreError(error);
      },

      setAnonymous(): void {
        this.accessToken = null;
        this.currentUser = null;
        this.error = null;
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

function toSessionStoreError(error: unknown): SessionStoreError {
  if (error instanceof ApiError) {
    return { message: error.message, requestId: error.requestId };
  }

  return { message: sessionErrorMessage, requestId: null };
}
