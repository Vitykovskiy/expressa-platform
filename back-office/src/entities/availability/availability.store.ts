import { defineStore } from "pinia";
import { computed, onScopeDispose, readonly, shallowRef } from "vue";
import { changeAvailability, readAvailability } from "./availability.api";
import { AVAILABILITY_MESSAGES } from "./availability.constants";
import type {
  AvailabilityCommand,
  AvailabilityContext,
  AvailabilityGroup,
  AvailabilityItem,
  AvailabilityScrollPosition,
} from "./availability.types";

export const useAvailabilityStore = defineStore("availability", () => {
  const groups = shallowRef<readonly AvailabilityGroup[]>([]);
  const selectedGroup = shallowRef<string | null>(null);
  const phase = shallowRef<"idle" | "loading" | "ready" | "error">("idle");
  const command = shallowRef<AvailabilityCommand | null>(null);
  const message = shallowRef("");
  const stale = shallowRef(false);
  const sessionExpired = shallowRef(false);
  const scrollPosition = shallowRef<AvailabilityScrollPosition>({
    desktop: 0,
    mobile: 0,
  });
  let context: AvailabilityContext | null = null;
  let reading: AbortController | null = null;
  let writing: AbortController | null = null;

  const visibleGroups = computed(() =>
    groups.value.filter(
      (group) =>
        selectedGroup.value === null || group.key === selectedGroup.value,
    ),
  );

  function clear() {
    context = null;
    stale.value = false;
    reading?.abort();
    writing?.abort();
    reading = null;
    writing = null;
    groups.value = [];
    selectedGroup.value = null;
    phase.value = "idle";
    command.value = null;
    message.value = "";
    sessionExpired.value = false;
    scrollPosition.value = { desktop: 0, mobile: 0 };
  }

  function rememberScroll(
    identityId: string,
    position: AvailabilityScrollPosition,
  ) {
    if (context?.identityId === identityId) {
      scrollPosition.value = position;
    }
  }

  async function activate(nextContext: AvailabilityContext) {
    if (
      context?.identityId !== nextContext.identityId ||
      context.accessToken !== nextContext.accessToken
    ) {
      clear();
      context = nextContext;
    }

    if (
      (phase.value !== "ready" || stale.value) &&
      reading === null &&
      command.value === null
    ) {
      await load();
    }
  }

  function invalidate() {
    stale.value = true;
  }

  function deactivate() {
    if (command.value !== null) {
      return;
    }

    reading?.abort();
    reading = null;

    if (phase.value === "loading") {
      phase.value = "idle";
    }
  }

  function selectGroup(key: string | null) {
    if (key === null || groups.value.some((group) => group.key === key)) {
      selectedGroup.value = key;
    }
  }

  async function load() {
    const owner = context;

    if (owner === null || reading !== null) {
      return false;
    }

    const controller = new AbortController();

    reading = controller;
    phase.value = "loading";
    const outcome = await readAvailability(
      owner.accessToken,
      controller.signal,
    );

    if (context !== owner || reading !== controller) {
      return false;
    }

    reading = null;

    if (outcome.kind === "loaded") {
      stale.value = false;
      groups.value = outcome.groups;
      phase.value = "ready";

      if (
        selectedGroup.value !== null &&
        !outcome.groups.some((group) => group.key === selectedGroup.value)
      ) {
        selectedGroup.value = null;
      }

      return true;
    }

    phase.value = outcome.kind === "cancelled" ? "idle" : "error";

    if (outcome.kind === "session-expired") {
      sessionExpired.value = true;
    } else if (outcome.kind !== "cancelled") {
      message.value = AVAILABILITY_MESSAGES.readFailed;
    }

    return false;
  }

  async function toggle(item: AvailabilityItem) {
    const owner = context;
    const current = groups.value
      .flatMap((group) => group.items)
      .find((row) => row.id === item.id && row.type === item.type);

    if (
      owner === null ||
      command.value !== null ||
      phase.value !== "ready" ||
      current === undefined
    ) {
      return;
    }

    const controller = new AbortController();

    writing = controller;
    command.value = { item: current, phase: "sending" };
    message.value = "";
    const outcome = await changeAvailability(
      owner.accessToken,
      current,
      controller.signal,
    );

    if (context !== owner || writing !== controller) {
      return;
    }

    writing = null;

    if (outcome.kind === "confirmed") {
      groups.value = groups.value.map((group) => ({
        ...group,
        items: group.items.map((row) =>
          row.type === current.type && row.id === current.id
            ? {
                ...row,
                available: outcome.available,
                description: outcome.description ?? row.description,
              }
            : row,
        ),
      }));
      command.value = null;
      if (stale.value) {
        await load();
      }

      return;
    }

    if (outcome.kind === "session-expired") {
      sessionExpired.value = true;

      return;
    }

    if (outcome.kind === "rejected") {
      command.value = null;
      message.value = AVAILABILITY_MESSAGES.rejected;

      return;
    }

    command.value = { item: current, phase: "checking" };
    message.value = `${current.name}: ${AVAILABILITY_MESSAGES.unknown}`;
    const reconciled = await load();

    if (context !== owner) {
      return;
    }

    if (reconciled) {
      command.value = null;
      message.value = `${current.name}: ${AVAILABILITY_MESSAGES.reconciled}`;
    } else if (!sessionExpired.value) {
      command.value = { item: current, phase: "unknown" };
      message.value = `${current.name}: ${AVAILABILITY_MESSAGES.checkFailed}`;
    }
  }

  onScopeDispose(clear);

  return {
    groups: readonly(groups),
    selectedGroup: readonly(selectedGroup),
    visibleGroups,
    phase: readonly(phase),
    stale: readonly(stale),
    command: readonly(command),
    message: readonly(message),
    sessionExpired: readonly(sessionExpired),
    scrollPosition: readonly(scrollPosition),
    activate,
    deactivate,
    invalidate,
    selectGroup,
    toggle,
    clear,
    rememberScroll,
  };
});
