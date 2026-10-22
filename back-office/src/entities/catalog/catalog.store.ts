import { defineStore } from "pinia";
import { onScopeDispose, readonly, shallowRef } from "vue";
import { readCatalog, writeCatalog } from "./catalog.api";
import type {
  CatalogCommand,
  CatalogContext,
  CatalogData,
  CatalogPendingCommand,
} from "./catalog.types";

const useCatalogState = defineStore("catalog", () => {
  const data = shallowRef<CatalogData | null>(null);
  const loading = shallowRef(false);
  const stale = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const sessionExpired = shallowRef(false);
  const command = shallowRef<CatalogPendingCommand | null>(null);
  const revision = shallowRef(0);
  let context: CatalogContext | null = null;
  let reading: AbortController | null = null;
  let writing: AbortController | null = null;

  function clear() {
    context = null;
    reading?.abort();
    writing?.abort();
    reading = null;
    writing = null;
    data.value = null;
    command.value = null;
    loading.value = false;
    stale.value = false;
    error.value = null;
    sessionExpired.value = false;
    revision.value = 0;
  }

  async function activate(next: CatalogContext) {
    if (
      context?.identityId !== next.identityId ||
      context.accessToken !== next.accessToken
    ) {
      clear();
      context = next;
    }

    if (data.value === null && command.value === null) {
      await load();
    }
  }

  function deactivate() {
    if (command.value === null) {
      reading?.abort();
      reading = null;
      loading.value = false;
    }
  }

  async function load() {
    const owner = context;

    if (owner === null || reading !== null || writing !== null) {
      return false;
    }

    const controller = new AbortController();

    reading = controller;
    loading.value = true;
    const outcome = await readCatalog(owner.accessToken, controller.signal);

    if (context !== owner || reading !== controller) {
      return false;
    }

    reading = null;
    loading.value = false;

    if (outcome.kind === "session-expired") {
      clear();
      sessionExpired.value = true;

      return false;
    }

    if (outcome.kind === "loaded") {
      data.value = outcome.data;
      stale.value = false;
      error.value = null;

      if (command.value?.phase === "unknown") {
        command.value = { ...command.value, checked: true };
      }

      return true;
    }

    if (outcome.kind !== "cancelled") {
      stale.value = data.value !== null;
      error.value =
        "Не удалось обновить меню. Ранее полученные данные могут быть неактуальны.";
    }

    return false;
  }

  async function execute(input: CatalogCommand) {
    const owner = context;

    if (
      owner === null ||
      command.value !== null ||
      loading.value ||
      stale.value
    ) {
      return { kind: "blocked" } as const;
    }

    const controller = new AbortController();

    writing = controller;
    command.value = { command: input, phase: "sending", checked: false };
    const outcome = await writeCatalog(
      owner.accessToken,
      input,
      controller.signal,
    );

    if (context !== owner || writing !== controller) {
      return { kind: "cancelled" } as const;
    }

    writing = null;

    if (outcome.kind === "session-expired") {
      clear();
      sessionExpired.value = true;

      return outcome;
    }

    if (outcome.kind === "unknown") {
      command.value = { command: input, phase: "unknown", checked: false };
      stale.value = true;

      return outcome;
    }

    if (outcome.kind === "confirmed") {
      revision.value += 1;
      await load();

      if (context !== owner || command.value?.command !== input) {
        return { kind: "cancelled" } as const;
      }
    }

    command.value = null;

    return outcome;
  }

  function acknowledgeUnknown() {
    if (command.value?.phase !== "unknown" || !command.value.checked) {
      return false;
    }

    command.value = null;

    return true;
  }

  onScopeDispose(clear);

  return {
    data,
    loading,
    stale,
    error,
    sessionExpired,
    command,
    revision,
    activate,
    deactivate,
    clear,
    load,
    execute,
    acknowledgeUnknown,
  };
});

export function useCatalogStore() {
  return readonly(useCatalogState());
}
