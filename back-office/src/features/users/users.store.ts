import { defineStore } from "pinia";
import { computed, onScopeDispose, readonly, shallowRef } from "vue";
import {
  readStaffUsers,
  sendUserCommand,
} from "../../entities/users/users.api";
import { USER_PHONE_PATTERN } from "../../entities/users/users.constants";
import type {
  StaffUser,
  UserCommand,
  UsersContext,
} from "../../entities/users/users.types";
import type {
  CreateUserInput,
  UserDialogPhase,
  UserPresentation,
  UserRole,
  UsersDialog,
  UsersFilter,
} from "./presentation/Users.types";
import { USERS_MESSAGES } from "./users.constants";
import { presentStaffUser, usersQuery } from "./users.mapper";
import type { UsersMutation, UsersReadPhase } from "./users.types";

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
  let context: UsersContext | null = null;
  let reading: AbortController | null = null;
  let writing: AbortController | null = null;
  let active = false;

  const users = computed(() => {
    const current = records.value;
    const owner = context;

    return owner === null
      ? []
      : current.map((user) => presentStaffUser(user, owner.identityId));
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
    context = null;
    active = false;
    reading?.abort();
    writing?.abort();
    reading = null;
    writing = null;
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

  function expire() {
    clear();
    sessionExpired.value = true;
  }

  async function activate(nextContext: UsersContext) {
    if (nextContext.role !== "administrator") {
      expire();

      return;
    }

    if (
      context?.identityId !== nextContext.identityId ||
      context.accessToken !== nextContext.accessToken
    ) {
      clear();
      context = { ...nextContext };
    }

    active = true;

    if (reading === null && mutation.value === null) {
      await load();
    }
  }

  function deactivate() {
    active = false;

    if (mutation.value !== null) {
      return;
    }

    reading?.abort();
    reading = null;

    if (phase.value === "loading") {
      phase.value = hasSnapshot.value ? "ready" : "idle";
    }
  }

  function rememberScroll(identityId: string, position: number) {
    if (
      context?.identityId === identityId &&
      Number.isFinite(position) &&
      position >= 0
    ) {
      scrollTop.value = position;
    }
  }

  async function load() {
    const owner = context;

    if (owner === null || owner.role !== "administrator") {
      return false;
    }

    reading?.abort();
    const controller = new AbortController();

    reading = controller;
    phase.value = "loading";
    readError.value = null;
    const outcome = await readStaffUsers(
      owner.accessToken,
      usersQuery(query.value, filter.value),
      controller.signal,
    );

    if (context !== owner || reading !== controller) {
      return false;
    }

    reading = null;

    if (outcome.kind === "session-expired") {
      expire();

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

    if (active && mutation.value === null) {
      void load();
    }
  }

  function selectFilter(value: UsersFilter) {
    filter.value = value;

    if (active && mutation.value === null) {
      void load();
    }
  }

  function revealPending() {
    if (dialog.value !== null) {
      dialogVisible.value = true;
    }
  }

  function openCreate() {
    if (context === null || context.role !== "administrator") {
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
      context === null ||
      context.role !== "administrator" ||
      user.id === context.identityId
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

    const target = presentStaffUser(current, context.identityId);

    dialog.value = {
      kind: kind === "role" ? "role" : target.blocked ? "unblock" : "block",
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

  async function execute(command: UserCommand) {
    const owner = context;

    if (
      owner === null ||
      owner.role !== "administrator" ||
      mutation.value !== null
    ) {
      return;
    }

    reading?.abort();
    reading = null;
    phase.value = hasSnapshot.value ? "ready" : "idle";
    const controller = new AbortController();
    const submitted = { ...command };

    writing = controller;
    mutation.value = { command: submitted, phase: "sending" };
    commandError.value = null;
    notice.value = null;
    const outcome = await sendUserCommand(
      owner.accessToken,
      submitted,
      controller.signal,
    );

    if (context !== owner || writing !== controller) {
      return;
    }

    writing = null;

    if (outcome.kind === "session-expired") {
      expire();

      return;
    }

    if (outcome.kind === "rejected") {
      mutation.value = null;
      commandError.value = outcome.message;
      notice.value = active ? null : outcome.message;

      return;
    }

    if (outcome.kind === "unknown") {
      mutation.value = { command: submitted, phase: "unknown" };
      commandError.value = USERS_MESSAGES.unknown;
      notice.value = USERS_MESSAGES.unknown;

      return;
    }

    const refreshed = await load();

    if (context !== owner) {
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

    if (name === "" || !USER_PHONE_PATTERN.test(phoneE164)) {
      commandError.value =
        name === "" ? USERS_MESSAGES.invalidName : USERS_MESSAGES.invalidPhone;

      return;
    }

    await execute({ kind: "create", name, phoneE164, role: input.role });
  }

  async function assignRole(id: string, role: UserRole) {
    if (dialog.value?.kind === "role" && dialog.value.user.id === id) {
      await execute({ kind: "role", id, role });
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
      await execute({ kind: "block", id, blocked });
    }
  }

  async function inspectCommand() {
    const owner = context;
    const current = mutation.value;

    if (
      owner === null ||
      current === null ||
      (current.phase !== "unknown" && current.phase !== "checked")
    ) {
      return;
    }

    mutation.value = { ...current, phase: "checking" };
    const refreshed = await load();

    if (context !== owner) {
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
