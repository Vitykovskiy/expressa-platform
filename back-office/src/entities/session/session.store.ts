import { computed, readonly, ref } from "vue";
import { defineStore } from "pinia";
import { ApiFailure } from "../../shared/api/transport";
import {
  endSession,
  readUser,
  refreshToken,
  requestOtp,
  verifyOtp,
} from "./auth.api";
import { mapUser } from "./session.mapper";
import type {
  AccessTokenDto,
  LogoutProofSupplier,
  SessionStatus,
  SessionUser,
} from "./session.types";

export const useSessionStore = defineStore("session", () => {
  const state = ref<SessionStatus>("restoring");
  const currentUser = ref<SessionUser | null>(null);
  const pending = ref(false);
  const message = ref("");
  let accessToken: string | null = null;
  let expiresAt = 0;
  let generation = 0;
  let refreshFlight: Promise<void> | null = null;

  function clear(status: SessionStatus) {
    generation += 1;
    accessToken = null;
    expiresAt = 0;
    currentUser.value = null;
    state.value = status;
  }

  async function establish(dto: AccessTokenDto, version: number) {
    const user = mapUser(await readUser(dto.accessToken));

    if (version !== generation) {
      throw new ApiFailure("aborted");
    }

    accessToken = dto.accessToken;
    expiresAt = Date.now() + dto.expiresInSeconds * 1000;
    currentUser.value = user;
    state.value = user.role === "customer" ? "denied" : "staff";
  }

  function handleSessionError(error: unknown) {
    if (
      error instanceof ApiFailure &&
      (error.status === 401 || error.status === 403)
    ) {
      clear("anonymous");
      message.value = "";
    } else {
      clear("unavailable");
      message.value = "Не удалось проверить сеанс";
    }
  }

  async function refresh() {
    if (refreshFlight !== null) {
      return refreshFlight;
    }

    const version = generation;
    const flight = (async () => {
      try {
        await establish(await refreshToken(), version);
      } catch (error) {
        if (version === generation) {
          handleSessionError(error);
        }

        throw error;
      }
    })();

    refreshFlight = flight;

    try {
      await flight;
    } finally {
      if (refreshFlight === flight) {
        refreshFlight = null;
      }
    }
  }

  async function restore() {
    if (pending.value || refreshFlight !== null) {
      return;
    }

    pending.value = true;
    clear("restoring");
    message.value = "";

    try {
      await refresh();
    } catch {
      // Refresh records an explicit anonymous/unavailable outcome.
    } finally {
      pending.value = false;
    }
  }

  async function requestCode(phone: string) {
    if (pending.value || refreshFlight !== null) {
      throw new ApiFailure("aborted");
    }

    pending.value = true;

    try {
      return await requestOtp(phone);
    } finally {
      pending.value = false;
    }
  }

  async function signIn(phone: string, code: string) {
    if (pending.value || refreshFlight !== null) {
      throw new ApiFailure("aborted");
    }

    pending.value = true;
    const version = generation;
    let verified = false;

    try {
      const dto = await verifyOtp(phone, code);

      verified = true;

      await establish(dto, version);
    } catch (error) {
      const definitive =
        !verified &&
        error instanceof ApiFailure &&
        error.kind === "http" &&
        error.status !== null &&
        (error.status < 500 || error.status === 503);

      if (!definitive) {
        clear("restoring");

        try {
          await refresh();
        } catch {
          // Unknown verify outcome is reconciled; no mutation replay.
        }
      }

      throw error;
    } finally {
      pending.value = false;
    }
  }

  async function logout(supplyProof?: LogoutProofSupplier) {
    if (pending.value || refreshFlight !== null) {
      return;
    }

    pending.value = true;
    message.value = "";
    const version = generation;
    const status = state.value;

    try {
      const proof =
        supplyProof === undefined
          ? null
          : await supplyProof().catch(() => null);

      if (version !== generation || status !== state.value) return;

      await endSession(proof);
      if (version !== generation) return;
      clear("anonymous");
    } catch (error) {
      if (version !== generation) return;

      if (
        error instanceof ApiFailure &&
        error.kind === "http" &&
        error.status !== null &&
        (error.status < 500 || error.status === 503)
      ) {
        message.value = "Не удалось выйти. Повторите попытку.";
      } else {
        clear("unavailable");
        message.value = "Не удалось подтвердить выход. Проверьте сеанс.";
      }
    } finally {
      pending.value = false;
    }
  }

  async function authenticatedGet<T>(
    read: (token: string) => Promise<T>,
  ): Promise<T> {
    if (state.value !== "staff" || pending.value) {
      throw new ApiFailure("aborted");
    }

    const version = generation;

    if (Date.now() >= expiresAt) {
      await refresh();
    }

    if (
      state.value !== "staff" ||
      accessToken === null ||
      version !== generation
    ) {
      throw new ApiFailure("aborted");
    }

    const requestedToken = accessToken;
    let result: T;

    try {
      result = await read(requestedToken);
    } catch (error) {
      if (version !== generation) {
        throw new ApiFailure("aborted");
      }

      if (!(error instanceof ApiFailure) || error.status !== 401) {
        if (error instanceof ApiFailure && error.status === 403) {
          clear("unavailable");
          message.value = "Доступ сотрудника недоступен";
        }

        throw error;
      }

      if (accessToken === requestedToken) {
        await refresh();
      }

      if (
        state.value !== "staff" ||
        accessToken === null ||
        version !== generation
      ) {
        throw new ApiFailure("aborted");
      }

      try {
        result = await read(accessToken);
      } catch (retryError) {
        if (version !== generation) {
          throw new ApiFailure("aborted");
        }

        if (
          retryError instanceof ApiFailure &&
          (retryError.status === 401 || retryError.status === 403)
        ) {
          handleSessionError(retryError);
        }

        throw retryError;
      }
    }

    if (version !== generation || state.value !== "staff") {
      throw new ApiFailure("aborted");
    }

    return result;
  }

  async function authenticatedCommand<T>(
    send: (token: string) => Promise<T>,
  ): Promise<T> {
    if (state.value !== "staff" || pending.value) {
      throw new ApiFailure("aborted");
    }

    const version = generation;

    if (Date.now() >= expiresAt) {
      await refresh();
    }

    if (
      state.value !== "staff" ||
      pending.value ||
      accessToken === null ||
      version !== generation
    ) {
      throw new ApiFailure("aborted");
    }

    try {
      // A sent command has no replay contract, including after an expired token.
      const result = await send(accessToken);

      if (version !== generation || state.value !== "staff") {
        throw new ApiFailure("aborted");
      }

      return result;
    } catch (error) {
      if (version !== generation) {
        throw new ApiFailure("aborted");
      }

      if (
        error instanceof ApiFailure &&
        (error.status === 401 || error.status === 403)
      ) {
        handleSessionError(error);
      }

      throw error;
    }
  }

  return {
    status: computed(() => state.value),
    user: computed(() =>
      currentUser.value === null ? null : readonly(currentUser.value),
    ),
    busy: computed(() => pending.value),
    error: computed(() => message.value),
    restore,
    requestCode,
    signIn,
    logout,
    authenticatedGet,
    authenticatedCommand,
  };
});
