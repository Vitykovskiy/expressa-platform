import { defineStore } from "pinia";
import { readonly, shallowRef } from "vue";
import {
  changePush,
  inspectPush,
  readPushKey,
} from "../../../entities/notifications/notifications.api";
import {
  nativePushProof,
  nativePushSupported,
  prepareNativePush,
} from "../../../entities/notifications/native-push";
import type {
  PushCommand,
  PushContext,
  PushInspection,
  PushProof,
} from "../../../entities/notifications/notifications.types";
import type { LogoutProofSupplier } from "../../../entities/session/session.types";

export const useNotificationsStore = defineStore("notifications", () => {
  const open = shallowRef(false);
  const busy = shallowRef(false);
  // Готовность worker/key не подтверждает permission, association или доставку.
  const ready = shallowRef(false);
  const verified = shallowRef(false);
  const message = shallowRef("");
  const inspection = shallowRef<PushInspection | null>(null);
  // Pending и unknown удерживают одну исходную команду до подтверждения или явной сверки.
  const command = shallowRef<PushCommand | null>(null);
  const inspectedUnknown = shallowRef(false);
  const sessionExpired = shallowRef(false);
  let activeContext: PushContext | null = null;
  let preparedPush: Awaited<ReturnType<typeof prepareNativePush>> = null;
  let subscriptionProof: PushProof | null = null;

  function reset() {
    activeContext = null;
    preparedPush = null;
    subscriptionProof = null;
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
      activeContext?.identityId !== next.identityId ||
      activeContext.accessToken !== next.accessToken
    ) {
      reset();
      activeContext = next;
    }
  }

  async function prepare() {
    const requestContext = activeContext;

    if (requestContext === null || busy.value || command.value !== null) {
      return;
    }

    if (!nativePushSupported()) {
      message.value =
        "Этот браузер не поддерживает уведомления. Работа с заказами доступна.";

      return;
    }

    busy.value = true;
    message.value = "Подготавливаем уведомления…";
    const key = await readPushKey(requestContext.accessToken);

    if (activeContext !== requestContext) {
      return;
    }

    if (key.kind === "expired") {
      expireSession();

      return;
    }

    let prepared: Awaited<ReturnType<typeof prepareNativePush>> = null;

    if (key.kind === "confirmed") {
      prepared = await prepareNativePush(key.value);
    }

    if (activeContext !== requestContext) {
      return;
    }

    preparedPush = prepared;
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
    if (activeContext === null) {
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
    const requestContext = activeContext;
    const prepared = preparedPush;

    if (requestContext === null || prepared === null || busy.value) {
      return;
    }

    busy.value = true;
    inspectedUnknown.value = false;
    verified.value = false;

    try {
      const subscription =
        await prepared.registration.pushManager.getSubscription();

      if (activeContext !== requestContext) {
        return;
      }

      // Сверяем исходный proof неизвестной команды, даже если native-подписка изменилась.
      let inspectedProof = command.value?.proof ?? null;

      if (inspectedProof === null && subscription !== null) {
        inspectedProof = nativePushProof(subscription);
      }

      subscriptionProof = inspectedProof;

      if (subscriptionProof === null) {
        inspection.value = { association: "none", version: null };
        verified.value = true;
        message.value = "Уведомления этого устройства не включены.";

        return;
      }

      const outcome = await inspectPush(
        requestContext.accessToken,
        subscriptionProof,
      );

      if (activeContext !== requestContext) {
        return;
      }

      if (outcome.kind === "expired") {
        expireSession();

        return;
      }

      if (outcome.kind !== "confirmed") {
        message.value = "Не удалось проверить связь. Изменения не повторялись.";

        return;
      }

      inspection.value = outcome.value;
      verified.value = true;
      inspectedUnknown.value = command.value !== null;
      message.value = describeInspection(outcome.value, command.value);
    } catch {
      if (activeContext === requestContext) {
        message.value =
          "Не удалось проверить уведомления. Работа с заказами доступна.";
      }
    } finally {
      if (activeContext === requestContext) {
        busy.value = false;
      }
    }
  }

  async function enable() {
    const requestContext = activeContext;
    const prepared = preparedPush;

    if (requestContext === null || busy.value || command.value !== null) {
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
      // Permission остаётся первым async-действием нового явного клика после подготовки.
      const permission = await globalThis.Notification.requestPermission();

      if (activeContext !== requestContext) {
        return;
      }

      if (permission !== "granted") {
        message.value =
          "Уведомления не разрешены. Основная работа доступна; разрешение меняется в настройках браузера.";

        return;
      }

      let subscription =
        await prepared.registration.pushManager.getSubscription();

      if (subscription === null) {
        subscription = await prepared.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: prepared.key,
        });
      }

      if (activeContext !== requestContext) {
        return;
      }

      const subscribedProof = nativePushProof(subscription);

      if (subscribedProof === null) {
        message.value = "Браузер не предоставил корректную подписку.";

        return;
      }

      subscriptionProof = subscribedProof;
      await submitAssociation(
        {
          action: "enable",
          proof: subscribedProof,
          expectedVersion: inspection.value?.version ?? null,
        },
        requestContext,
      );
    } catch {
      if (activeContext === requestContext) {
        message.value =
          "Браузер не включил уведомления. Можно проверить состояние; работа доступна.";
      }
    } finally {
      if (activeContext === requestContext) {
        busy.value = false;
      }
    }
  }

  async function disable() {
    const requestContext = activeContext;
    const version = inspection.value?.version;

    if (requestContext === null || subscriptionProof === null) {
      return;
    }

    if (!verified.value || inspection.value?.association !== "current") {
      return;
    }

    // DELETE применим только к подтверждённой собственной версии связи.
    if (version === null || version === undefined) {
      return;
    }

    if (busy.value || command.value !== null) {
      return;
    }

    busy.value = true;
    await submitAssociation(
      { action: "disable", proof: subscriptionProof, expectedVersion: version },
      requestContext,
    );

    if (activeContext === requestContext) {
      busy.value = false;
    }
  }

  async function submitAssociation(
    input: PushCommand,
    requestContext: PushContext,
  ) {
    // До подтверждённого исхода сохраняем неизменные action/proof/version и контекст запроса.
    command.value = input;
    const outcome = await changePush(requestContext.accessToken, input);

    if (activeContext !== requestContext) {
      return;
    }

    if (outcome.kind === "expired") {
      expireSession();

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

  /**
   * Фиксирует собственный подтверждённый proof до перехода session в pending.
   * Supplier после сброса store только читает native-подписку: отсутствие,
   * ошибка, отмена или несовпадение дают null для session-only logout (ADR-009).
   */
  function logoutProofSupplier(
    requestContext: PushContext,
  ): LogoutProofSupplier {
    const registration = preparedPush?.registration;
    const confirmedProof = confirmedOwnProof(requestContext);

    return async (signal) => {
      if (
        confirmedProof === null ||
        registration === undefined ||
        signal.aborted
      ) {
        return null;
      }

      try {
        const subscription = await registration.pushManager.getSubscription();
        const currentProof =
          subscription === null ? null : nativePushProof(subscription);

        if (
          signal.aborted ||
          currentProof?.endpoint !== confirmedProof.endpoint ||
          currentProof.keys.p256dh !== confirmedProof.keys.p256dh ||
          currentProof.keys.auth !== confirmedProof.keys.auth
        ) {
          return null;
        }

        return currentProof;
      } catch {
        return null;
      }
    };
  }

  function confirmedOwnProof(requestContext: PushContext): PushProof | null {
    if (activeContext?.identityId !== requestContext.identityId) {
      return null;
    }

    if (activeContext.accessToken !== requestContext.accessToken) {
      return null;
    }

    if (!verified.value || busy.value || command.value !== null) {
      return null;
    }

    if (inspection.value?.association !== "current") {
      return null;
    }

    return subscriptionProof;
  }

  function expireSession() {
    reset();
    sessionExpired.value = true;
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

function describeInspection(
  currentInspection: PushInspection,
  unresolvedCommand: PushCommand | null,
): string {
  if (unresolvedCommand !== null) {
    return "Показана текущая связь; это не подтверждает результат исходной команды.";
  }

  if (currentInspection.association === "current") {
    return "Уведомления этого устройства включены для вашего сеанса.";
  }

  if (currentInspection.association === "other") {
    return "Устройство связано с другим аккаунтом. Бариста не переносит чужую связь.";
  }

  return "Уведомления этого устройства не включены.";
}
