import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { ApiFailure } from "../../shared/api/transport";
import {
  compatibleSubscription,
  nativeRead,
  ownedActive,
  prepareNativePush,
  pushAvailable,
  readNativePush,
  sameProof,
  subscriptionProof,
  validateServerKey,
} from "../../shared/browser/web-push";
import type {
  NativePushOwner,
  NativePushProof,
  NativePushState,
} from "../../shared/browser/web-push.types";
import { useSessionStore } from "../session/session.store";
import {
  disableAssociation,
  enableAssociation,
  inspectAssociation,
  readPublicKey,
} from "./notification.api";
import {
  associationCopy,
  notificationActionLabels,
} from "./notification.constants";
import type {
  NotificationOperation,
  NotificationPhase,
  NotificationView,
  PushAssociation,
} from "./notification.types";

export const useNotificationStore = defineStore("notification", () => {
  const session = useSessionStore();
  const eligible = computed(
    () => session.status === "staff" && session.user?.role === "barista",
  );
  const identity = computed(() =>
    eligible.value ? (session.user?.id ?? "") : "",
  );
  const phase = ref<NotificationPhase>("idle");
  const message = ref("");
  const state = ref<PushAssociation | null>(null);
  const permission = ref<NotificationPermission>("default");
  const available = ref(true);
  const prepared = ref(false);
  const retryEnable = ref(false);
  const recovery = ref<PushAssociation | null>(null);
  const revision = ref(0);
  let epoch = 0;
  let owner: NativePushOwner | null = null;
  let native: NativePushState | null = null;
  let key: Uint8Array<ArrayBuffer> | null = null;
  let confirmedProof: NativePushProof | null = null;
  let operation: NotificationOperation | null = null;
  let reads = new AbortController();

  function current(version: number, user: string, allowBusy = false) {
    return (
      version === epoch &&
      user !== "" &&
      user === identity.value &&
      (allowBusy || !session.busy)
    );
  }

  function ownedOperation() {
    return operation !== null &&
      operation.identity === identity.value &&
      operation.epoch === epoch
      ? operation
      : null;
  }

  const view = computed<NotificationView>(() => {
    // Private operation changes publish through this local revision only.
    void revision.value;
    const active = ownedOperation();
    const pending = ["reading", "preparing", "sending"].includes(phase.value);
    let primary: NotificationView["primary"] = null;
    let copy = message.value;

    if (phase.value === "reading") copy = "Проверяем состояние уведомлений…";
    else if (phase.value === "preparing") copy = "Подготавливаем подключение…";
    else if (phase.value === "sending")
      copy =
        active?.action === "disable"
          ? "Отключаем уведомления…"
          : "Подключаем уведомления…";
    else if (active?.unknown)
      primary = recovery.value === null ? "read" : "finish";
    else if (copy !== "")
      primary = available.value
        ? retryEnable.value
          ? "enable"
          : "read"
        : null;
    else if (!available.value) copy = "Уведомления недоступны в этом браузере";
    else if (permission.value === "denied") {
      copy = "Браузер запретил показ уведомлений";
      primary = state.value?.association === "current" ? "disable" : "read";
    } else {
      copy =
        state.value === null
          ? "Не удалось проверить состояние уведомлений"
          : associationCopy[state.value.association];
      primary =
        state.value === null || state.value.association === "other"
          ? "read"
          : state.value.association === "current"
            ? "disable"
            : "enable";
    }

    if (phase.value === "preparing") primary = "enable";
    if (phase.value === "sending") primary = active?.action ?? null;
    if (
      !pending &&
      active === null &&
      state.value?.association === "current" &&
      confirmedProof === null
    )
      primary = "read";
    if (phase.value === "reading" || (operation !== null && active === null))
      primary = null;

    return {
      message: copy,
      context: active?.unknown
        ? "Результат действия не подтверждён"
        : permission.value === "denied" &&
            state.value?.association === "current"
          ? "Привязка к вашему аккаунту сохранена"
          : state.value?.association === "current"
            ? "На этом устройстве для вашего аккаунта"
            : prepared.value
              ? "Для подключения нажмите «Включить уведомления»"
              : "",
      recovery:
        recovery.value === null
          ? ""
          : `Текущая привязка: ${associationCopy[recovery.value.association].toLowerCase()}`,
      primary,
      primaryLabel: primary === null ? "" : notificationActionLabels[primary],
      pending,
      indicator: active?.unknown
        ? "Требует проверки"
        : phase.value === "preparing" || phase.value === "sending"
          ? "Выполняется"
          : "",
    };
  });

  function configure(value: NativePushOwner) {
    owner = value;
  }

  async function inspect(
    proof: NativePushProof,
    version: number,
    user: string,
  ) {
    return session.authenticatedCommand((token) => {
      if (!current(version, user)) throw new ApiFailure("aborted");

      return inspectAssociation(token, proof);
    });
  }

  async function read() {
    if (
      !eligible.value ||
      session.busy ||
      ["reading", "preparing", "sending"].includes(phase.value) ||
      owner === null
    )
      return;

    const version = epoch;
    const user = identity.value;
    const captured = ownedOperation();

    phase.value = "reading";
    message.value = "";
    retryEnable.value = false;

    try {
      available.value = pushAvailable();
      if (!available.value) return;
      if (captured?.unknown && captured.proof !== null) {
        const result = await inspect(captured.proof, version, user);

        if (!current(version, user) || operation !== captured) return;
        captured.inspected = result;
        recovery.value = result;
        message.value =
          captured.action === "enable"
            ? "Не удалось подтвердить подключение"
            : "Не удалось подтвердить отключение";

        return;
      }

      const publicKey = await session.authenticatedGet(readPublicKey);
      const signal = reads.signal;
      const validated = await validateServerKey(publicKey, signal);
      const result = await readNativePush(owner, signal);
      const association =
        result.proof === null
          ? { association: "none" as const, version: null }
          : await inspect(result.proof, version, user);

      if (!current(version, user)) return;
      if (
        result.subscription !== null &&
        !compatibleSubscription(result.subscription, validated)
      )
        throw new Error("Incompatible native subscription");

      key = validated;
      native = result;
      permission.value = result.permission;
      state.value = association;
      confirmedProof =
        association.association === "current" ? result.proof : null;
    } catch {
      if (current(version, user))
        message.value = "Не удалось проверить состояние уведомлений";
    } finally {
      if (current(version, user, true)) {
        phase.value = captured?.unknown ? "unknown" : "idle";
        revision.value += 1;
      }
    }
  }

  async function prepare() {
    if (owner === null) return;

    const version = epoch;
    const user = identity.value;

    phase.value = "preparing";
    message.value = "";
    retryEnable.value = false;
    try {
      const publicKey = await session.authenticatedGet(readPublicKey);
      const signal = reads.signal;
      const validated = await validateServerKey(publicKey, signal);

      if (!current(version, user)) return;

      const result = await prepareNativePush(owner, signal);
      const association =
        result.proof === null
          ? { association: "none" as const, version: null }
          : await inspect(result.proof, version, user);

      if (!current(version, user)) return;
      if (
        result.subscription !== null &&
        !compatibleSubscription(result.subscription, validated)
      )
        throw new Error("Incompatible native subscription");

      key = validated;
      native = result;
      permission.value = result.permission;
      state.value = association;
      confirmedProof =
        association.association === "current" ? result.proof : null;
      prepared.value = true;
    } catch {
      if (current(version, user)) {
        message.value = "Не удалось подготовить подключение";
        retryEnable.value = true;
      }
    } finally {
      if (current(version, user, true)) phase.value = "idle";
    }
  }

  function enable() {
    if (
      view.value.primary !== "enable" ||
      view.value.pending ||
      session.busy ||
      owner === null ||
      operation !== null
    )
      return;
    if (
      key === null ||
      native?.registration === null ||
      native === null ||
      !ownedActive(native.registration, owner)
    ) {
      void prepare();

      return;
    }

    if (Notification.permission === "denied") {
      permission.value = "denied";

      return;
    }

    const captured: NotificationOperation = {
      identity: identity.value,
      epoch,
      action: "enable",
      proof: native.proof,
      version: null,
      sent: false,
      unknown: false,
      inspected: null,
    };

    operation = captured;
    phase.value = "sending";
    message.value = "";
    let subscription: Promise<PushSubscription>;

    try {
      // The fresh button gesture reaches subscribe before any awaited work.
      subscription =
        native.subscription !== null &&
        compatibleSubscription(native.subscription, key)
          ? Promise.resolve(native.subscription)
          : native.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: key,
            });
    } catch (error) {
      settleFailure(captured, error);

      return;
    }

    void connect(captured, subscription);
  }

  async function connect(
    captured: NotificationOperation,
    subscription: Promise<PushSubscription>,
  ) {
    try {
      const signal = reads.signal;
      const result = await nativeRead(subscription, signal);
      const proof = await subscriptionProof(result, signal);

      captured.proof = proof;
      if (
        !current(captured.epoch, captured.identity) ||
        owner === null ||
        key === null ||
        native?.registration == null ||
        !ownedActive(native.registration, owner) ||
        !compatibleSubscription(result, key) ||
        Notification.permission !== "granted"
      )
        throw new ApiFailure("aborted");

      const actual = await readNativePush(owner, signal);

      if (
        !current(captured.epoch, captured.identity) ||
        actual.proof === null ||
        !sameProof(actual.proof, proof)
      )
        throw new ApiFailure("aborted");

      native = {
        registration: native.registration,
        subscription: result,
        proof,
        permission: Notification.permission,
      };
      permission.value = Notification.permission;
      const association = await inspect(
        proof,
        captured.epoch,
        captured.identity,
      );

      if (!current(captured.epoch, captured.identity))
        throw new ApiFailure("aborted");
      if (association.association !== "none") {
        state.value = association;
        confirmedProof = association.association === "current" ? proof : null;
        operation = null;
        phase.value = "idle";

        return;
      }

      const connected = await session.authenticatedCommand((token) => {
        if (
          !current(captured.epoch, captured.identity) ||
          Notification.permission !== "granted"
        )
          throw new ApiFailure("aborted");

        captured.sent = true;

        return enableAssociation(token, proof);
      });

      if (!current(captured.epoch, captured.identity))
        throw new ApiFailure("aborted");

      state.value = connected;
      confirmedProof = proof;
      operation = null;
      phase.value = "idle";
      prepared.value = false;
    } catch (error) {
      settleFailure(captured, error);
    }
  }

  function settleFailure(captured: NotificationOperation, error: unknown) {
    const known =
      error instanceof ApiFailure &&
      error.kind === "http" &&
      error.response !== null &&
      ((error.status === 400 && error.response.code === "VALIDATION_ERROR") ||
        (error.status === 409 &&
          error.response.code === "PUSH_ASSOCIATION_CONFLICT") ||
        (error.status === 401 && error.response.code === "UNAUTHORIZED") ||
        (error.status === 403 && error.response.code === "ACCESS_DENIED"));

    captured.unknown = captured.sent && !known;

    if (!current(captured.epoch, captured.identity, true)) {
      if (!captured.unknown && operation === captured) operation = null;

      return;
    }

    permission.value =
      "Notification" in window ? Notification.permission : "default";
    retryEnable.value = !captured.sent && permission.value === "default";
    message.value = captured.unknown
      ? captured.action === "enable"
        ? "Не удалось подтвердить подключение"
        : "Не удалось подтвердить отключение"
      : error instanceof ApiFailure && error.status === 409 && known
        ? "Привязка изменилась. Проверьте состояние"
        : permission.value === "default" && !captured.sent
          ? "Разрешение не получено"
          : captured.action === "enable"
            ? "Не удалось подключить уведомления"
            : "Не удалось отключить уведомления";
    phase.value = captured.unknown ? "unknown" : "idle";
    if (!captured.unknown) operation = null;
    if (!captured.unknown && permission.value === "denied") message.value = "";
    revision.value += 1;
  }

  async function disable() {
    if (
      view.value.primary !== "disable" ||
      view.value.pending ||
      session.busy ||
      operation !== null ||
      confirmedProof === null ||
      state.value?.association !== "current" ||
      state.value.version === null ||
      owner === null
    )
      return;

    const captured: NotificationOperation = {
      identity: identity.value,
      epoch,
      action: "disable",
      proof: confirmedProof,
      version: state.value.version,
      sent: false,
      unknown: false,
      inspected: null,
    };

    operation = captured;
    phase.value = "sending";
    message.value = "";
    try {
      const actual = await readNativePush(owner, reads.signal);

      if (
        !current(captured.epoch, captured.identity) ||
        actual.proof === null ||
        !sameProof(actual.proof, confirmedProof)
      )
        throw new ApiFailure("aborted");

      await session.authenticatedCommand((token) => {
        if (!current(captured.epoch, captured.identity))
          throw new ApiFailure("aborted");

        captured.sent = true;

        return disableAssociation(token, actual.proof!, captured.version!);
      });
      if (!current(captured.epoch, captured.identity))
        throw new ApiFailure("aborted");

      state.value = { association: "none", version: null };
      confirmedProof = null;
      operation = null;
      phase.value = "idle";
    } catch (error) {
      settleFailure(captured, error);
    }
  }

  function finish() {
    const captured = ownedOperation();

    if (
      session.busy ||
      captured?.unknown !== true ||
      captured.inspected === null ||
      phase.value !== "unknown"
    )
      return;

    operation = null;
    state.value = captured.inspected;
    recovery.value = null;
    confirmedProof = null;
    native = null;
    key = null;
    phase.value = "idle";
    message.value = "";
    prepared.value = false;
    revision.value += 1;
  }

  async function logoutProof(): Promise<NativePushProof | null> {
    const version = epoch;
    const user = identity.value;
    const proof = confirmedProof;

    if (
      !eligible.value ||
      owner === null ||
      proof === null ||
      state.value?.association !== "current" ||
      !pushAvailable()
    )
      return null;
    try {
      const actual = await readNativePush(owner, reads.signal);

      return current(version, user, true) &&
        proof === confirmedProof &&
        actual.proof !== null &&
        sameProof(actual.proof, proof)
        ? actual.proof
        : null;
    } catch {
      return null;
    }
  }

  watch(
    identity,
    () => {
      epoch += 1;
      reads.abort();
      reads = new AbortController();
      native = null;
      key = null;
      confirmedProof = null;
      state.value = null;
      message.value = "";
      phase.value = "idle";
      prepared.value = false;
      retryEnable.value = false;
      recovery.value = null;
      revision.value += 1;
      // Captured sent uncertainty remains private; it is never projected to a new actor.
    },
    { flush: "sync" },
  );

  function dispose() {
    epoch += 1;
    reads.abort();
  }

  return {
    eligible,
    view,
    configure,
    read,
    enable,
    disable,
    finish,
    logoutProof,
    dispose,
  };
});
