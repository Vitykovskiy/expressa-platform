import { defineStore } from "pinia";
import { computed, onScopeDispose, readonly, shallowRef } from "vue";
import { readStaffUsers, sendUserCommand } from "./users.api";
import { USER_PHONE_PATTERN } from "./users.constants";
import type { StaffUser, UserCommand, UsersContext } from "./users.types";
import type {
  CreateUserInput,
  UserDialogPhase,
  UserPresentation,
  UserRole,
  UsersDialog,
  UsersFilter,
} from "./components/Users.types";
import { USERS_MESSAGES } from "./users.store.constants";
import { presentStaffUser, buildUsersQuery } from "./users.presenter";
import type { UsersMutation, UsersReadPhase } from "./users.store.types";

export const useUsersStore = defineStore("staff-users", () => {
  const records = shallowRef<readonly StaffUser[]>([]);
  const query = shallowRef("");
  const filter = shallowRef<UsersFilter>("all");
  const phase = shallowRef<UsersReadPhase>("idle");
  const hasSnapshot = shallowRef(false);
  const readError = shallowRef<string | null>(null);
  const dialog = shallowRef<UsersDialog | null>(null);
  const dialogVisible = shallowRef(false);
  const mutation = shallowRef<UsersMutation | null>(null);
  const commandError = shallowRef<string | null>(null);
  const notice = shallowRef<string | null>(null);
  const sessionExpired = shallowRef(false);
  const scrollTop = shallowRef(0);
  let sessionContext: UsersContext | null = null;
  let readController: AbortController | null = null;
  let commandController: AbortController | null = null;
  let pageActive = false;

  const users = computed(() => {
    const currentRecords = records.value;
    const requestContext = sessionContext;

    if (requestContext === null) {
      return [];
    }

    return currentRecords.map((user) =>
      presentStaffUser(user, requestContext.identityId),
    );
  });
  const visibleDialog = computed(() =>
    dialogVisible.value ? dialog.value : null,
  );
  const dialogPhase = computed<UserDialogPhase>(
    () => mutation.value?.phase ?? "editing",
  );
  const submitting = computed(
    () =>
      mutation.value?.phase === "sending" ||
      mutation.value?.phase === "checking",
  );
  const needsInspection = computed(
    () => mutation.value !== null && mutation.value.phase !== "sending",
  );
  const busy = computed(() => dialog.value !== null || mutation.value !== null);

  function clear() {
    sessionContext = null;
    pageActive = false;
    readController?.abort();
    commandController?.abort();
    readController = null;
    commandController = null;
    records.value = [];
    query.value = "";
    filter.value = "all";
    phase.value = "idle";
    hasSnapshot.value = false;
    readError.value = null;
    dialog.value = null;
    dialogVisible.value = false;
    mutation.value = null;
    commandError.value = null;
    notice.value = null;
    sessionExpired.value = false;
    scrollTop.value = 0;
  }

  function expireSession() {
    clear();
    sessionExpired.value = true;
  }

  async function activate(nextContext: UsersContext) {
    if (nextContext.role !== "administrator") {
      expireSession();

      return;
    }

    if (
      sessionContext?.identityId !== nextContext.identityId ||
      sessionContext.accessToken !== nextContext.accessToken
    ) {
      clear();
      sessionContext = { ...nextContext };
    }

    pageActive = true;

    if (readController === null && mutation.value === null) {
      await load();
    }
  }

  function deactivate() {
    pageActive = false;

    if (mutation.value !== null) {
      return;
    }

    readController?.abort();
    readController = null;

    if (phase.value === "loading") {
      phase.value = hasSnapshot.value ? "ready" : "idle";
    }
  }

  function rememberScroll(identityId: string, position: number) {
    if (
      sessionContext?.identityId === identityId &&
      Number.isFinite(position) &&
      position >= 0
    ) {
      scrollTop.value = position;
    }
  }

  async function load() {
    const requestContext = sessionContext;

    if (requestContext === null || requestContext.role !== "administrator") {
      return false;
    }

    readController?.abort();
    const controller = new AbortController();

    readController = controller;
    phase.value = "loading";
    readError.value = null;
    const outcome = await readStaffUsers(
      requestContext.accessToken,
      buildUsersQuery(query.value, filter.value),
      controller.signal,
    );

    // Отмена запроса не гарантирует, что его завершение не придёт позже.
    if (sessionContext !== requestContext || readController !== controller) {
      return false;
    }

    readController = null;

    if (outcome.kind === "session-expired") {
      expireSession();

      return false;
    }

    if (outcome.kind === "loaded") {
      records.value = outcome.users;
      hasSnapshot.value = true;
      phase.value = "ready";

      return true;
    }

    phase.value = hasSnapshot.value ? "ready" : "error";

    if (outcome.kind !== "cancelled") {
      readError.value = hasSnapshot.value
        ? USERS_MESSAGES.readFailed
        : USERS_MESSAGES.initialFailed;
    }

    return false;
  }

  function selectQuery(value: string) {
    query.value = value;

    if (pageActive && mutation.value === null) {
      void load();
    }
  }

  function selectFilter(value: UsersFilter) {
    filter.value = value;

    if (pageActive && mutation.value === null) {
      void load();
    }
  }

  function revealPending() {
    if (dialog.value !== null) {
      dialogVisible.value = true;
    }
  }

  function openCreate() {
    if (sessionContext === null || sessionContext.role !== "administrator") {
      return;
    }

    if (mutation.value !== null) {
      revealPending();

      return;
    }

    dialog.value = {
      kind: "create",
      draft: { name: "", phone: "", role: "barista" },
    };
    commandError.value = null;
    dialogVisible.value = true;
  }

  function openUser(user: UserPresentation, kind: "role" | "access") {
    if (
      sessionContext === null ||
      sessionContext.role !== "administrator" ||
      user.id === sessionContext.identityId
    ) {
      return;
    }

    if (mutation.value !== null) {
      revealPending();

      return;
    }

    const current = records.value.find((record) => record.id === user.id);

    if (current === undefined) {
      return;
    }

    const target = presentStaffUser(current, sessionContext.identityId);
    const accessAction = target.blocked ? "unblock" : "block";

    dialog.value = {
      kind: kind === "role" ? "role" : accessAction,
      user: target,
      selectedRole: target.role,
    };
    commandError.value = null;
    dialogVisible.value = true;
  }

  function closeDialog() {
    if (submitting.value) {
      return;
    }

    dialogVisible.value = false;

    if (mutation.value?.phase === "unknown") {
      notice.value = USERS_MESSAGES.unknown;

      return;
    }

    dialog.value = null;
    mutation.value = null;
    commandError.value = null;
  }

  function updateDraft(draft: CreateUserInput) {
    if (dialog.value?.kind === "create" && mutation.value === null) {
      dialog.value = { kind: "create", draft: { ...draft } };
      commandError.value = null;
    }
  }

  function selectRole(role: UserRole) {
    if (dialog.value?.kind === "role" && mutation.value === null) {
      dialog.value = { ...dialog.value, selectedRole: role };
      commandError.value = null;
    }
  }

  async function submitCommand(command: UserCommand) {
    const requestContext = sessionContext;

    if (
      requestContext === null ||
      requestContext.role !== "administrator" ||
      mutation.value !== null
    ) {
      return;
    }

    readController?.abort();
    readController = null;
    phase.value = hasSnapshot.value ? "ready" : "idle";
    const controller = new AbortController();
    // Черновик может измениться после отправки; сохраняем исходную команду.
    const submittedCommand = { ...command };

    commandController = controller;
    mutation.value = { command: submittedCommand, phase: "sending" };
    commandError.value = null;
    notice.value = null;
    const outcome = await sendUserCommand(
      requestContext.accessToken,
      submittedCommand,
      controller.signal,
    );

    if (sessionContext !== requestContext || commandController !== controller) {
      return;
    }

    commandController = null;

    if (outcome.kind === "session-expired") {
      expireSession();

      return;
    }

    if (outcome.kind === "rejected") {
      mutation.value = null;
      commandError.value = outcome.message;
      notice.value = pageActive ? null : outcome.message;

      return;
    }

    if (outcome.kind === "unknown") {
      mutation.value = { command: submittedCommand, phase: "unknown" };
      commandError.value = USERS_MESSAGES.unknown;
      notice.value = USERS_MESSAGES.unknown;

      return;
    }

    const refreshed = await load();

    if (sessionContext !== requestContext) {
      return;
    }

    mutation.value = null;
    dialog.value = null;
    dialogVisible.value = false;
    notice.value = refreshed ? null : USERS_MESSAGES.savedStale;
  }

  async function create(input: CreateUserInput) {
    if (dialog.value?.kind !== "create") {
      return;
    }

    const name = input.name.trim();
    const phoneE164 = input.phone.replace(/[\s()-]/g, "");

    if (name === "") {
      commandError.value = USERS_MESSAGES.invalidName;

      return;
    }

    if (!USER_PHONE_PATTERN.test(phoneE164)) {
      commandError.value = USERS_MESSAGES.invalidPhone;

      return;
    }

    await submitCommand({ kind: "create", name, phoneE164, role: input.role });
  }

  async function assignRole(id: string, role: UserRole) {
    if (dialog.value?.kind === "role" && dialog.value.user.id === id) {
      await submitCommand({ kind: "role", id, role });
    }
  }

  async function setBlocked(id: string, blocked: boolean) {
    const current = dialog.value;

    if (
      current !== null &&
      (current.kind === "block" || current.kind === "unblock") &&
      current.user.id === id &&
      blocked === (current.kind === "block")
    ) {
      await submitCommand({ kind: "block", id, blocked });
    }
  }

  async function inspectCommand() {
    const requestContext = sessionContext;
    const current = mutation.value;

    if (
      requestContext === null ||
      current === null ||
      (current.phase !== "unknown" && current.phase !== "checked")
    ) {
      return;
    }

    // GET показывает текущие данные, но не подтверждает авторство изменения.
    mutation.value = { ...current, phase: "checking" };
    const refreshed = await load();

    if (sessionContext !== requestContext) {
      return;
    }

    mutation.value = { ...current, phase: refreshed ? "checked" : "unknown" };
    commandError.value = refreshed
      ? USERS_MESSAGES.inspected
      : USERS_MESSAGES.inspectionFailed;
    notice.value = commandError.value;
  }

  onScopeDispose(clear);

  return {
    users,
    query: readonly(query),
    filter: readonly(filter),
    phase: readonly(phase),
    hasSnapshot: readonly(hasSnapshot),
    readError: readonly(readError),
    dialog: visibleDialog,
    dialogPhase,
    submitting,
    needsInspection,
    busy,
    notice: readonly(notice),
    commandError: readonly(commandError),
    sessionExpired: readonly(sessionExpired),
    scrollTop: readonly(scrollTop),
    rememberScroll,
    activate,
    deactivate,
    clear,
    load,
    selectQuery,
    selectFilter,
    openCreate,
    openUser,
    closeDialog,
    updateDraft,
    selectRole,
    create,
    assignRole,
    setBlocked,
    inspectCommand,
    revealPending,
  };
});
