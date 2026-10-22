import { defineStore } from "pinia";
import { onScopeDispose, readonly, shallowRef } from "vue";
import {
  endSession,
  readIdentity,
  refreshSession,
  verifySession,
} from "./session.api";
import { MILLISECONDS_PER_SECOND } from "./session.constants";
import type {
  SessionOutcome,
  SessionState,
  TokenOutcome,
  LogoutProofSupplier,
  LogoutPushProof,
} from "./session.types";

export const useSessionStore = defineStore("session", () => {
  const state = shallowRef<SessionState>({ kind: "anonymous" });
  let activeRequest: AbortController | null = null;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  function invalidate() {
    activeRequest?.abort();
    activeRequest = null;
    clearTimeout(expiryTimer);
    state.value = { kind: "anonymous" };
  }

  async function establish(
    phone: string,
    code: string,
  ): Promise<SessionOutcome> {
    if (activeRequest !== null) {
      return { kind: "cancelled" };
    }

    const controller = beginRequest();
    const outcome = await verifySession(phone, code, controller.signal);

    return consumeToken(outcome, controller);
  }

  async function restore(): Promise<SessionOutcome> {
    if (activeRequest !== null) {
      return { kind: "cancelled" };
    }

    const controller = beginRequest();
    const outcome = await refreshSession(controller.signal);

    return consumeToken(outcome, controller);
  }

  async function logout(supplyProof?: LogoutProofSupplier): Promise<boolean> {
    if (activeRequest !== null) {
      return false;
    }

    const controller = beginRequest();
    let proof: LogoutPushProof | null = null;

    try {
      proof = (await supplyProof?.(controller.signal)) ?? null;
    } catch {
      proof = null;
    }

    if (!requestIsActive(controller)) {
      return false;
    }

    const ended = await endSession(controller.signal, proof);

    if (activeRequest !== controller) {
      return false;
    }

    activeRequest = null;

    if (ended) {
      invalidate();
    } else {
      state.value = { kind: "uncertain" };
    }

    return ended;
  }

  function beginRequest() {
    clearTimeout(expiryTimer);
    state.value = { kind: "pending" };
    const controller = new AbortController();

    activeRequest = controller;

    return controller;
  }

  function requestIsActive(controller: AbortController): boolean {
    return activeRequest === controller && !controller.signal.aborted;
  }

  async function consumeToken(
    outcome: TokenOutcome,
    controller: AbortController,
  ): Promise<SessionOutcome> {
    if (activeRequest !== controller) {
      return { kind: "cancelled" };
    }

    if (outcome.kind !== "token") {
      activeRequest = null;
      state.value = {
        kind: outcome.kind === "uncertain" ? "uncertain" : "anonymous",
      };

      return outcome;
    }

    const expiresAt =
      Date.now() + outcome.token.expiresInSeconds * MILLISECONDS_PER_SECOND;
    const result = await readIdentity(
      outcome.token.accessToken,
      controller.signal,
    );

    if (activeRequest !== controller) {
      return { kind: "cancelled" };
    }

    activeRequest = null;

    if (result.kind !== "identity") {
      state.value = {
        kind: result.kind === "uncertain" ? "uncertain" : "anonymous",
      };

      return result;
    }

    if (result.identity.role === "customer") {
      state.value = { kind: "denied", identity: result.identity };

      return { kind: "denied" };
    }

    if (expiresAt <= Date.now()) {
      state.value = { kind: "anonymous" };

      return { kind: "anonymous" };
    }

    state.value = {
      kind: "staff",
      session: {
        identity: result.identity,
        accessToken: outcome.token.accessToken,
        expiresAt,
      },
    };
    expiryTimer = setTimeout(invalidate, expiresAt - Date.now());

    return { kind: "staff" };
  }

  onScopeDispose(invalidate);

  return { state: readonly(state), establish, restore, invalidate, logout };
});
