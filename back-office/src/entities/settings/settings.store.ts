import { defineStore } from "pinia";
import { computed, onScopeDispose, readonly, shallowRef } from "vue";
import { readSettings, saveSettings } from "./settings.api";
import {
  SETTINGS_MESSAGES,
  SETTINGS_SAVED_VISIBLE_MS,
} from "./settings.constants";
import { sameSettings, settingsToDraft } from "./settings.mapper";
import { parseSettingsDraft } from "./settings.validation";
import type {
  OperatingSettings,
  SettingsCommand,
  SettingsContext,
  SettingsDraft,
  SettingsPhase,
} from "./settings.types";

export const useSettingsStore = defineStore("operating-settings", () => {
  const confirmed = shallowRef<OperatingSettings | null>(null);
  const draft = shallowRef<SettingsDraft | null>(null);
  const phase = shallowRef<SettingsPhase>("idle");
  const command = shallowRef<SettingsCommand | null>(null);
  const message = shallowRef("");
  const stale = shallowRef(false);
  const saved = shallowRef(false);
  const active = shallowRef(false);
  const sessionExpired = shallowRef(false);
  let context: SettingsContext | null = null;
  let reading: AbortController | null = null;
  let writing: AbortController | null = null;
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  const parsed = computed(() =>
    draft.value === null ? null : parseSettingsDraft(draft.value),
  );
  const dirty = computed(() => {
    if (draft.value === null || confirmed.value === null) {
      return false;
    }

    const baseline = settingsToDraft(confirmed.value);

    return (
      draft.value.opensAt !== baseline.opensAt ||
      draft.value.closesAt !== baseline.closesAt ||
      draft.value.slotCapacity !== baseline.slotCapacity
    );
  });
  const editingDisabled = computed(
    () => command.value !== null || phase.value === "loading" || !active.value,
  );
  const canSave = computed(
    () =>
      !editingDisabled.value &&
      parsed.value !== null &&
      confirmed.value !== null &&
      !stale.value,
  );
  const saving = computed(
    () =>
      command.value?.phase === "sending" ||
      command.value?.phase === "refreshing",
  );
  const validationMessage = computed(() =>
    dirty.value && parsed.value === null ? SETTINGS_MESSAGES.invalid : "",
  );

  function clearSaved() {
    clearTimeout(savedTimer);
    savedTimer = undefined;
    saved.value = false;
  }

  function reset() {
    context = null;
    active.value = false;
    reading?.abort();
    writing?.abort();
    reading = null;
    writing = null;
    clearSaved();
    confirmed.value = null;
    draft.value = null;
    phase.value = "idle";
    command.value = null;
    stale.value = false;
    message.value = "";
    sessionExpired.value = false;
  }

  function expire() {
    reset();
    sessionExpired.value = true;
  }

  async function activate(next: SettingsContext) {
    if (
      context?.identityId !== next.identityId ||
      context.accessToken !== next.accessToken
    ) {
      reset();
      context = { ...next };
    }

    active.value = true;

    if (command.value === null) {
      await refresh();
    }
  }

  function deactivate() {
    active.value = false;
    reading?.abort();
    reading = null;
    clearSaved();

    if (phase.value === "loading") {
      phase.value = confirmed.value === null ? "idle" : "ready";
    }
  }

  function updateDraft(next: SettingsDraft) {
    if (editingDisabled.value || draft.value === null) {
      return;
    }

    draft.value = { ...next };

    if (!stale.value) {
      message.value = "";
    }

    clearSaved();
  }

  async function refresh() {
    if (
      context === null ||
      !active.value ||
      reading !== null ||
      command.value !== null
    ) {
      return;
    }

    const owner = context;
    const controller = new AbortController();
    const keepDraft = dirty.value;

    reading = controller;
    phase.value = "loading";
    const outcome = await readSettings(owner.accessToken, controller.signal);

    if (reading !== controller || context !== owner) {
      return;
    }

    reading = null;

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind !== "loaded") {
      phase.value = confirmed.value === null ? "error" : "ready";
      stale.value = confirmed.value !== null;
      message.value = stale.value
        ? SETTINGS_MESSAGES.stale
        : SETTINGS_MESSAGES.readFailed;

      return;
    }

    confirmed.value = outcome.settings;

    if (!keepDraft || draft.value === null) {
      draft.value = settingsToDraft(outcome.settings);
    }

    phase.value = "ready";
    stale.value = false;
    message.value = "";
  }

  async function save() {
    if (!canSave.value || parsed.value === null || context === null) {
      return;
    }

    const owner = context;
    const submitted = { ...parsed.value };
    const controller = new AbortController();

    writing = controller;
    command.value = { phase: "sending", observed: null };
    message.value = "";
    clearSaved();
    const outcome = await saveSettings(
      owner.accessToken,
      submitted,
      controller.signal,
    );

    if (writing !== controller || context !== owner) {
      return;
    }

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind === "unknown") {
      writing = null;
      command.value = { phase: "unknown", observed: null };
      message.value = SETTINGS_MESSAGES.unknown;

      return;
    }

    if (outcome.kind === "rejected" || outcome.kind === "not-sent") {
      writing = null;
      command.value = null;
      message.value =
        outcome.kind === "rejected"
          ? SETTINGS_MESSAGES.rejected
          : SETTINGS_MESSAGES.notSent;

      return;
    }

    confirmed.value = outcome.settings;
    draft.value = settingsToDraft(outcome.settings);
    command.value = { phase: "refreshing", observed: null };
    const observed = await readSettings(owner.accessToken, controller.signal);

    if (writing !== controller || context !== owner) {
      return;
    }

    writing = null;
    command.value = null;

    if (observed.kind === "session-expired") {
      expire();

      return;
    }

    stale.value = observed.kind !== "loaded";

    if (observed.kind === "loaded") {
      confirmed.value = observed.settings;
      draft.value = settingsToDraft(observed.settings);
      message.value = sameSettings(observed.settings, submitted)
        ? ""
        : SETTINGS_MESSAGES.changedAfterSave;
    } else {
      message.value = SETTINGS_MESSAGES.savedReadFailed;
    }

    if (active.value && message.value === "") {
      saved.value = true;
      savedTimer = setTimeout(clearSaved, SETTINGS_SAVED_VISIBLE_MS);
    }
  }

  async function inspectUnknown() {
    const original = command.value;

    if (
      context === null ||
      !active.value ||
      original === null ||
      (original.phase !== "unknown" && original.phase !== "inspected")
    ) {
      return;
    }

    const owner = context;
    const controller = new AbortController();

    writing = controller;
    command.value = { ...original, phase: "inspecting", observed: null };
    const outcome = await readSettings(owner.accessToken, controller.signal);

    if (writing !== controller || context !== owner) {
      return;
    }

    writing = null;

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind !== "loaded") {
      command.value = { ...original, phase: "unknown", observed: null };
      message.value = SETTINGS_MESSAGES.inspectFailed;

      return;
    }

    command.value = {
      ...original,
      phase: "inspected",
      observed: outcome.settings,
    };
    message.value = SETTINGS_MESSAGES.inspected;
  }

  function finishInspection() {
    const current = command.value;

    if (
      !active.value ||
      current?.phase !== "inspected" ||
      current.observed === null
    ) {
      return;
    }

    confirmed.value = current.observed;
    draft.value = settingsToDraft(current.observed);
    command.value = null;
    stale.value = false;
    message.value = "";
  }

  onScopeDispose(reset);

  return {
    confirmed: readonly(confirmed),
    draft: readonly(draft),
    phase: readonly(phase),
    command: readonly(command),
    message: readonly(message),
    stale: readonly(stale),
    saved: readonly(saved),
    sessionExpired: readonly(sessionExpired),
    active: readonly(active),
    dirty,
    canSave,
    saving,
    editingDisabled,
    validationMessage,
    activate,
    deactivate,
    reset,
    refresh,
    updateDraft,
    save,
    inspectUnknown,
    finishInspection,
  };
});
