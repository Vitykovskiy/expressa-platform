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
  SettingsInput,
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
  let readController: AbortController | null = null;
  let commandController: AbortController | null = null;
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  const parsedDraft = computed(() =>
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
      parsedDraft.value !== null &&
      confirmed.value !== null &&
      !stale.value,
  );

  const saving = computed(
    () =>
      command.value?.phase === "sending" ||
      command.value?.phase === "refreshing",
  );

  const validationMessage = computed(() =>
    dirty.value && parsedDraft.value === null ? SETTINGS_MESSAGES.invalid : "",
  );

  function clearSaved() {
    clearTimeout(savedTimer);
    savedTimer = undefined;
    saved.value = false;
  }

  function reset() {
    context = null;
    active.value = false;
    readController?.abort();
    commandController?.abort();
    readController = null;
    commandController = null;
    clearSaved();
    confirmed.value = null;
    draft.value = null;
    phase.value = "idle";
    command.value = null;
    stale.value = false;
    message.value = "";
    sessionExpired.value = false;
  }

  function replaceConfirmedAndDraft(settings: OperatingSettings) {
    confirmed.value = settings;
    draft.value = settingsToDraft(settings);
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
    readController?.abort();
    readController = null;
    // Уже отправленная команда и её перечитывание продолжаются вне раздела.
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
      readController !== null ||
      command.value !== null
    ) {
      return;
    }

    const requestContext = context;
    const controller = new AbortController();
    const preserveEditedDraft = dirty.value;

    readController = controller;
    phase.value = "loading";
    const outcome = await readSettings(
      requestContext.accessToken,
      controller.signal,
    );

    if (readController !== controller || context !== requestContext) {
      return;
    }

    readController = null;

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

    if (!preserveEditedDraft || draft.value === null) {
      draft.value = settingsToDraft(outcome.settings);
    }

    phase.value = "ready";
    stale.value = false;
    message.value = "";
  }

  async function save() {
    if (!canSave.value || parsedDraft.value === null || context === null) {
      return;
    }

    const requestContext = context;
    const submitted = { ...parsedDraft.value };
    const controller = new AbortController();

    commandController = controller;
    command.value = { phase: "sending", observed: null };
    message.value = "";
    clearSaved();
    const outcome = await saveSettings(
      requestContext.accessToken,
      submitted,
      controller.signal,
    );

    if (commandController !== controller || context !== requestContext) {
      return;
    }

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind === "unknown") {
      commandController = null;
      // Неизвестный исход оставляет исходный draft заблокированным до сверки.
      command.value = { phase: "unknown", observed: null };
      message.value = SETTINGS_MESSAGES.unknown;

      return;
    }

    if (outcome.kind === "rejected" || outcome.kind === "not-sent") {
      commandController = null;
      command.value = null;
      message.value =
        outcome.kind === "rejected"
          ? SETTINGS_MESSAGES.rejected
          : SETTINGS_MESSAGES.notSent;

      return;
    }

    replaceConfirmedAndDraft(outcome.settings);
    command.value = { phase: "refreshing", observed: null };
    await refreshAfterSave(requestContext, submitted, controller);
  }

  async function refreshAfterSave(
    requestContext: SettingsContext,
    submitted: SettingsInput,
    controller: AbortController,
  ) {
    const observed = await readSettings(
      requestContext.accessToken,
      controller.signal,
    );

    if (commandController !== controller || context !== requestContext) {
      return;
    }

    commandController = null;
    command.value = null;

    if (observed.kind === "session-expired") {
      expire();

      return;
    }

    stale.value = observed.kind !== "loaded";

    if (observed.kind === "loaded") {
      replaceConfirmedAndDraft(observed.settings);
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

    const requestContext = context;
    const controller = new AbortController();

    commandController = controller;
    command.value = { ...original, phase: "inspecting", observed: null };
    const outcome = await readSettings(
      requestContext.accessToken,
      controller.signal,
    );

    if (commandController !== controller || context !== requestContext) {
      return;
    }

    commandController = null;

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind !== "loaded") {
      command.value = { ...original, phase: "unknown", observed: null };
      message.value = SETTINGS_MESSAGES.inspectFailed;

      return;
    }

    // GET показывает текущее состояние, но не доказывает исход нашей записи.
    // Подтверждённые значения и исходный draft заменит только finishInspection.
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

    replaceConfirmedAndDraft(current.observed);
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
