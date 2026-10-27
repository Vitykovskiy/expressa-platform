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
  SessionIdentity,
  SessionState,
  TokenOutcome,
  LogoutProofSupplier,
  LogoutPushProof,
} from "./session.types";

export const useSessionStore = defineStore("session", () => {
  const state = shallowRef<SessionState>({ kind: "anonymous" });
  // Контроллер обозначает текущую операцию: после invalidate её ответы не меняют сеанс.
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

    const controller = beginSessionRequest();
    const outcome = await verifySession(phone, code, controller.signal);

    return establishFromToken(outcome, controller);
  }

  async function restore(): Promise<SessionOutcome> {
    if (activeRequest !== null) {
      return { kind: "cancelled" };
    }

    const controller = beginSessionRequest();
    const outcome = await refreshSession(controller.signal);

    return establishFromToken(outcome, controller);
  }

  async function logout(supplyProof?: LogoutProofSupplier): Promise<boolean> {
    if (activeRequest !== null) {
      return false;
    }

    const controller = beginSessionRequest();
    let proof: LogoutPushProof | null = null;

    try {
      proof = (await supplyProof?.(controller.signal)) ?? null;
    } catch {
      // Staff logout допускает session-only запрос, если proof получить не удалось.
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

  function beginSessionRequest() {
    clearTimeout(expiryTimer);
    state.value = { kind: "pending" };
    const controller = new AbortController();

    activeRequest = controller;

    return controller;
  }

  function requestIsActive(controller: AbortController): boolean {
    return activeRequest === controller && !controller.signal.aborted;
  }

  async function establishFromToken(
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

    // Ожидание /me входит в срок токена, поэтому отсчёт начинается до запроса.
    const expiresAt =
      Date.now() + outcome.token.expiresInSeconds * MILLISECONDS_PER_SECOND;
    const identityOutcome = await readIdentity(
      outcome.token.accessToken,
      controller.signal,
    );

    if (activeRequest !== controller) {
      return { kind: "cancelled" };
    }

    activeRequest = null;

    if (identityOutcome.kind !== "identity") {
      state.value = {
        kind: identityOutcome.kind === "uncertain" ? "uncertain" : "anonymous",
      };

      return identityOutcome;
    }

    return acceptIdentity(
      identityOutcome.identity,
      outcome.token.accessToken,
      expiresAt,
    );
  }

  function acceptIdentity(
    identity: SessionIdentity,
    accessToken: string,
    expiresAt: number,
  ): SessionOutcome {
    if (
      identity.context !== "staff" ||
      identity.employee === null ||
      !identity.employee.accessEnabled
    ) {
      state.value = { kind: "denied", identity };

      return { kind: "denied" };
    }

    if (expiresAt <= Date.now()) {
      state.value = { kind: "anonymous" };

      return { kind: "anonymous" };
    }

    state.value = {
      kind: "staff",
      session: {
        identity: {
          ...identity,
          context: "staff",
          employee: { ...identity.employee, accessEnabled: true },
        },
        accessToken,
        expiresAt,
      },
    };
    expiryTimer = setTimeout(invalidate, expiresAt - Date.now());

    return { kind: "staff" };
  }

  onScopeDispose(invalidate);

  return { state: readonly(state), establish, restore, invalidate, logout };
});
