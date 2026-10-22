import { defineStore } from "pinia";
import { readonly, shallowRef } from "vue";
import {
  changePush,
  inspectPush,
  readPushKey,
} from "../../entities/notifications/notifications.api";
import {
  nativePushProof,
  nativePushSupported,
  prepareNativePush,
} from "../../entities/notifications/native-push";
import type {
  PushCommand,
  PushContext,
  PushInspection,
  PushProof,
} from "../../entities/notifications/notifications.types";
import type { LogoutProofSupplier } from "../../entities/session/session.types";

export const useNotificationsStore = defineStore("notifications", () => {
  const open = shallowRef(false);
  const busy = shallowRef(false);
  const ready = shallowRef(false);
  const verified = shallowRef(false);
  const message = shallowRef("");
  const inspection = shallowRef<PushInspection | null>(null);
  const command = shallowRef<PushCommand | null>(null);
  const inspectedUnknown = shallowRef(false);
  const sessionExpired = shallowRef(false);
  let context: PushContext | null = null;
  let native: Awaited<ReturnType<typeof prepareNativePush>> = null;
  let proof: PushProof | null = null;

  function reset() {
    context = null;
    native = null;
    proof = null;
    open.value = false;
    busy.value = false;
    ready.value = false;
    verified.value = false;
    message.value = "";
    inspection.value = null;
    command.value = null;
    inspectedUnknown.value = false;
    sessionExpired.value = false;
  }

  function activate(next: PushContext) {
    if (
      context?.identityId !== next.identityId ||
      context.accessToken !== next.accessToken
    ) {
      reset();
      context = next;
    }
  }

  async function prepare() {
    const owner = context;

    if (owner === null || busy.value || command.value !== null) {
      return;
    }

    if (!nativePushSupported()) {
      message.value =
        "Этот браузер не поддерживает уведомления. Работа с заказами доступна.";

      return;
    }

    busy.value = true;
    message.value = "Подготавливаем уведомления…";
    const key = await readPushKey(owner.accessToken);

    if (context !== owner) {
      return;
    }

    if (key.kind === "expired") {
      reset();
      sessionExpired.value = true;

      return;
    }

    const prepared =
      key.kind === "confirmed" ? await prepareNativePush(key.value) : null;

    if (context !== owner) {
      return;
    }

    native = prepared;
    ready.value = prepared !== null;
    busy.value = false;
    if (prepared === null) {
      message.value =
        "Не удалось подготовить уведомления. Можно повторить подготовку.";

      return;
    }

    message.value = "Готово. Для разрешения нажмите «Включить уведомления».";
    await inspect();
  }

  async function show() {
    if (context === null) {
      return;
    }

    open.value = true;
    if (!ready.value && command.value === null) {
      await prepare();
    }
  }

  function close() {
    open.value = false;
  }

  async function inspect() {
    const owner = context;
    const prepared = native;

    if (owner === null || prepared === null || busy.value) {
      return;
    }

    busy.value = true;
    inspectedUnknown.value = false;
    verified.value = false;
    try {
      const subscription =
        await prepared.registration.pushManager.getSubscription();

      if (context !== owner) {
        return;
      }

      proof =
        command.value?.proof ??
        (subscription === null ? null : nativePushProof(subscription));
      if (proof === null) {
        inspection.value = { association: "none", version: null };
        verified.value = true;
        message.value =
          command.value === null
            ? "Уведомления этого устройства не включены."
            : "Результат исходной команды неизвестен; подписка браузера сейчас отсутствует.";
        inspectedUnknown.value = command.value !== null;

        return;
      }

      const outcome = await inspectPush(owner.accessToken, proof);

      if (context !== owner) {
        return;
      }

      if (outcome.kind === "expired") {
        reset();
        sessionExpired.value = true;

        return;
      }

      if (outcome.kind !== "confirmed") {
        message.value = "Не удалось проверить связь. Изменения не повторялись.";

        return;
      }

      inspection.value = outcome.value;
      verified.value = true;
      inspectedUnknown.value = command.value !== null;
      message.value =
        command.value !== null
          ? "Показана текущая связь; это не подтверждает результат исходной команды."
          : outcome.value.association === "current"
            ? "Уведомления этого устройства включены для вашего сеанса."
            : outcome.value.association === "other"
              ? "Устройство связано с другим аккаунтом. Бариста не переносит чужую связь."
              : "Уведомления этого устройства не включены.";
    } catch {
      if (context === owner) {
        message.value =
          "Не удалось проверить уведомления. Работа с заказами доступна.";
      }
    } finally {
      if (context === owner) {
        busy.value = false;
      }
    }
  }

  async function enable() {
    const owner = context;
    const prepared = native;

    if (owner === null || busy.value || command.value !== null) {
      return;
    }

    if (prepared === null || !ready.value) {
      await prepare();

      return;
    }

    if (!verified.value || inspection.value?.association === "other") {
      return;
    }

    busy.value = true;
    try {
      const permission = await globalThis.Notification.requestPermission();

      if (context !== owner) {
        return;
      }

      if (permission !== "granted") {
        message.value =
          "Уведомления не разрешены. Основная работа доступна; разрешение меняется в настройках браузера.";

        return;
      }

      const existing =
        await prepared.registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await prepared.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: prepared.key,
        }));

      if (context !== owner) {
        return;
      }

      const currentProof = nativePushProof(subscription);

      if (currentProof === null) {
        message.value = "Браузер не предоставил корректную подписку.";

        return;
      }

      proof = currentProof;
      await submit(
        {
          action: "enable",
          proof: currentProof,
          expectedVersion: inspection.value?.version ?? null,
        },
        owner,
      );
    } catch {
      if (context === owner) {
        message.value =
          "Браузер не включил уведомления. Можно проверить состояние; работа доступна.";
      }
    } finally {
      if (context === owner) {
        busy.value = false;
      }
    }
  }

  async function disable() {
    const owner = context;
    const version = inspection.value?.version;

    if (
      owner === null ||
      proof === null ||
      !verified.value ||
      inspection.value?.association !== "current" ||
      version === null ||
      version === undefined ||
      busy.value ||
      command.value !== null
    ) {
      return;
    }

    busy.value = true;
    await submit({ action: "disable", proof, expectedVersion: version }, owner);
    if (context === owner) {
      busy.value = false;
    }
  }

  async function submit(input: PushCommand, owner: PushContext) {
    command.value = input;
    const outcome = await changePush(owner.accessToken, input);

    if (context !== owner) {
      return;
    }

    if (outcome.kind === "expired") {
      reset();
      sessionExpired.value = true;

      return;
    }

    if (outcome.kind === "unknown") {
      message.value =
        "Результат изменения неизвестен. Проверьте текущую связь; команда не повторяется.";

      return;
    }

    command.value = null;
    if (outcome.kind === "refused") {
      verified.value = false;
      message.value =
        "Связь изменилась или команда отклонена. Проверьте текущее состояние.";

      return;
    }

    verified.value = true;
    inspection.value = {
      association: outcome.value === null ? "none" : "current",
      version: outcome.value,
    };
    message.value =
      input.action === "enable"
        ? "Уведомления включены."
        : "Связь этого устройства отключена. Разрешение браузера сохранено.";
  }

  function finishInspection() {
    if (!busy.value && inspectedUnknown.value) {
      command.value = null;
      inspectedUnknown.value = false;
      message.value =
        "Сверка завершена. Показано текущее состояние, исходная команда не повторялась.";
    }
  }

  function logoutProofSupplier(owner: PushContext): LogoutProofSupplier {
    const registration = native?.registration;
    const confirmed =
      context?.identityId === owner.identityId &&
      context.accessToken === owner.accessToken &&
      verified.value &&
      !busy.value &&
      command.value === null &&
      inspection.value?.association === "current"
        ? proof
        : null;

    return async (signal) => {
      if (confirmed === null || registration === undefined || signal.aborted) {
        return null;
      }

      try {
        const subscription = await registration.pushManager.getSubscription();
        const current =
          subscription === null ? null : nativePushProof(subscription);

        if (
          signal.aborted ||
          current?.endpoint !== confirmed.endpoint ||
          current.keys.p256dh !== confirmed.keys.p256dh ||
          current.keys.auth !== confirmed.keys.auth
        ) {
          return null;
        }

        return current;
      } catch {
        return null;
      }
    };
  }

  return {
    open: readonly(open),
    busy: readonly(busy),
    ready: readonly(ready),
    verified: readonly(verified),
    message: readonly(message),
    inspection: readonly(inspection),
    command: readonly(command),
    inspectedUnknown: readonly(inspectedUnknown),
    sessionExpired: readonly(sessionExpired),
    activate,
    reset,
    show,
    close,
    prepare,
    inspect,
    enable,
    disable,
    finishInspection,
    logoutProofSupplier,
  };
});
