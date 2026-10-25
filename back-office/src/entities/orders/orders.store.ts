import { defineStore } from "pinia";
import { computed, onScopeDispose, readonly, shallowRef } from "vue";
import { readOrder, readOrders, sendOrderCommand } from "./orders.api";
import {
  ORDERS_POLL_INTERVAL,
  ORDER_MESSAGES,
  ORDER_STAGE_VIEWS,
  ORDER_ACTION_ALLOWED_STAGES,
} from "./orders.constants";
import { toOrderRecord } from "./orders.mapper";
import type {
  OrderRecord,
  OrdersContext,
  OrdersIntent,
  OrdersQuery,
  OrdersView,
  OrderAction,
  OrderCommand,
  OrderDialog,
  OrderNavigationRequest,
} from "./orders.types";

export const useOrdersStore = defineStore("orders", () => {
  const orders = shallowRef<readonly OrderRecord[]>([]);
  const phase = shallowRef<"idle" | "loading" | "ready" | "error">("idle");
  const message = shallowRef<string | null>(null);
  const rejectionError = shallowRef<string | null>(null);
  const readError = shallowRef<string | null>(null);
  const sessionExpired = shallowRef(false);
  const intent = shallowRef<OrdersIntent>({ kind: "invalid" });
  const view = shallowRef<OrdersView>("all");
  const command = shallowRef<OrderCommand | null>(null);
  const dialog = shallowRef<OrderDialog | null>(null);
  const detail = shallowRef<OrderRecord | null>(null);
  const detailMessage = shallowRef<string | null>(null);
  const detailLoading = shallowRef(false);
  const checkedOrder = shallowRef<OrderRecord | null>(null);
  const scrollPosition = shallowRef(0);
  let context: OrdersContext | null = null;
  let active = false;
  let pollingTimer: ReturnType<typeof globalThis.setInterval> | null = null;
  let listReadController: AbortController | null = null;
  let detailReadController: AbortController | null = null;
  let detailRequestOrderId: string | null = null;
  let commandController: AbortController | null = null;
  let reconciliationController: AbortController | null = null;

  const selectedOrderId = computed(() =>
    intent.value.kind === "valid" ? intent.value.orderId : null,
  );

  const selectedOrder = computed(() => {
    const id = selectedOrderId.value;

    return id === null ? null : findOrder(id);
  });

  const query = computed<OrdersQuery | null>(() =>
    intent.value.kind === "valid"
      ? {
          number: intent.value.number,
          stage: intent.value.stage,
          view: view.value,
        }
      : null,
  );

  const commandsDisabled = computed(
    () =>
      phase.value !== "ready" ||
      command.value !== null ||
      intent.value.kind === "invalid",
  );

  const rejectionDialogOpen = computed(
    () => dialog.value?.mode === "reject" && command.value === null,
  );

  function stopPolling() {
    if (pollingTimer !== null) {
      globalThis.clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  function stopReads() {
    listReadController?.abort();
    detailReadController?.abort();
    listReadController = null;
    detailReadController = null;
    detailRequestOrderId = null;
    detailLoading.value = false;
  }

  function reset() {
    active = false;
    context = null;
    stopPolling();
    stopReads();
    commandController?.abort();
    reconciliationController?.abort();
    commandController = null;
    reconciliationController = null;
    orders.value = [];
    phase.value = "idle";
    message.value = null;
    rejectionError.value = null;
    readError.value = null;
    sessionExpired.value = false;
    intent.value = { kind: "invalid" };
    view.value = "all";
    command.value = null;
    dialog.value = null;
    detail.value = null;
    detailMessage.value = null;
    checkedOrder.value = null;
    scrollPosition.value = 0;
  }

  function expireSession() {
    reset();
    sessionExpired.value = true;
  }

  async function activate(
    nextContext: OrdersContext,
    nextIntent: OrdersIntent,
  ) {
    if (
      context?.identityId !== nextContext.identityId ||
      context.accessToken !== nextContext.accessToken
    ) {
      reset();
      context = nextContext;
    }

    const previousIntent = intent.value;
    const queueChanged =
      previousIntent.kind !== nextIntent.kind ||
      (previousIntent.kind === "valid" &&
        nextIntent.kind === "valid" &&
        (previousIntent.number !== nextIntent.number ||
          previousIntent.stage !== nextIntent.stage));

    intent.value = nextIntent;
    active = nextIntent.kind === "valid";

    if (!active) {
      stopPolling();
      stopReads();
      phase.value = "error";
      readError.value = ORDER_MESSAGES.invalidAddress;
      orders.value = [];
      detail.value = null;

      return;
    }

    if (nextIntent.kind === "valid" && nextIntent.stage !== null) {
      view.value = ORDER_STAGE_VIEWS[nextIntent.stage];
    }

    if (queueChanged) {
      stopReads();
      orders.value = [];
      phase.value = "idle";
    }

    if (pollingTimer === null) {
      pollingTimer = globalThis.setInterval(() => {
        void refresh().then(loadSelectedOrder);
      }, ORDERS_POLL_INTERVAL);
    }

    await refresh();
    await loadSelectedOrder();
  }

  function deactivate() {
    active = false;
    stopPolling();
    stopReads();
    restorePhaseAfterReadStopped();
    // Отправленная команда и её сверка живут до результата, даже вне раздела.
  }

  function restorePhaseAfterReadStopped() {
    if (phase.value === "loading") {
      phase.value = orders.value.length > 0 ? "ready" : "idle";
    }
  }

  async function refresh() {
    const owner = context;
    const selectedQuery = query.value;

    if (!active || owner === null || selectedQuery === null) {
      return;
    }

    // Открытая форма удерживает заказ: опрос не должен блокировать отправку.
    if (rejectionDialogOpen.value) {
      return;
    }

    if (listReadController !== null || detailReadController !== null) {
      return;
    }

    if (
      command.value?.phase === "sending" ||
      command.value?.phase === "checking"
    ) {
      return;
    }

    const controller = new AbortController();

    listReadController = controller;
    phase.value = "loading";
    const result = await readOrders(
      owner.accessToken,
      selectedQuery,
      controller.signal,
    );

    if (context !== owner || listReadController !== controller) {
      return;
    }

    listReadController = null;

    if (result.kind === "session-expired") {
      expireSession();

      return;
    }

    if (result.kind === "loaded") {
      orders.value = result.orders
        .map(toOrderRecord)
        .sort(
          (left, right) =>
            Date.parse(left.createdAt) - Date.parse(right.createdAt) ||
            left.id.localeCompare(right.id),
        );
      phase.value = "ready";
      readError.value = null;

      if (command.value === null) {
        message.value = null;
      }

      return;
    }

    if (result.kind !== "cancelled") {
      phase.value = "error";
      readError.value = ORDER_MESSAGES.readFailed;
    }
  }

  function navigationRequest(): OrderNavigationRequest | null {
    if (intent.value.kind !== "valid") {
      return null;
    }

    return {
      number: intent.value.number,
      stage: intent.value.stage,
      orderId: intent.value.orderId,
    };
  }

  async function selectView(nextView: OrdersView) {
    if (intent.value.kind !== "valid") {
      return null;
    }

    stopReads();
    view.value = nextView;
    intent.value = { ...intent.value, stage: null };
    orders.value = [];
    phase.value = "idle";
    await refresh();
    await loadSelectedOrder();

    return navigationRequest();
  }

  async function selectOrder(id: string | null) {
    if (intent.value.kind !== "valid") {
      return null;
    }

    intent.value = { ...intent.value, orderId: id };
    await loadSelectedOrder();

    return navigationRequest();
  }

  async function loadSelectedOrder() {
    const owner = context;
    const id = selectedOrderId.value;

    if (listReadController !== null || rejectionDialogOpen.value) {
      return;
    }

    if (detailReadController !== null && detailRequestOrderId === id) {
      return;
    }

    detailReadController?.abort();
    detailReadController = null;
    detailRequestOrderId = null;
    detailMessage.value = null;
    detailLoading.value = false;

    if (
      owner === null ||
      !active ||
      id === null ||
      command.value !== null ||
      orders.value.some((order) => order.id === id)
    ) {
      return;
    }

    const controller = new AbortController();

    detailReadController = controller;
    detailRequestOrderId = id;
    detailLoading.value = true;
    const result = await readOrder(owner.accessToken, id, controller.signal);

    if (
      context !== owner ||
      detailReadController !== controller ||
      selectedOrderId.value !== id
    ) {
      return;
    }

    detailReadController = null;
    detailRequestOrderId = null;
    detailLoading.value = false;

    if (result.kind === "session-expired") {
      expireSession();

      return;
    }

    if (result.kind === "loaded") {
      detail.value = toOrderRecord(result.order);

      return;
    }

    if (result.kind === "cancelled") {
      return;
    }

    if (result.kind === "not-found" && detail.value?.id === id) {
      detail.value = null;
    }

    detailMessage.value =
      result.kind === "not-found"
        ? ORDER_MESSAGES.notFound
        : ORDER_MESSAGES.detailFailed;
  }

  function findOrder(id: string) {
    return (
      orders.value.find((order) => order.id === id) ??
      (detail.value?.id === id ? detail.value : null)
    );
  }

  function openDialog(id: string, mode: "reject" | "issue") {
    const order = findOrder(id);

    if (
      commandsDisabled.value ||
      order === null ||
      order.rejection !== null ||
      (mode === "reject" ? order.stage !== "CREATED" : order.stage !== "READY")
    ) {
      return;
    }

    if (mode === "reject") {
      // Черновик отклонения удерживает прочитанный заказ до результата отправки.
      stopReads();
      rejectionError.value = null;
    }

    dialog.value = { orderId: id, mode, reason: "", error: null };
  }

  function updateReason(reason: string) {
    if (dialog.value !== null && command.value === null) {
      dialog.value = { ...dialog.value, reason, error: null };
    }
  }

  function closeDialog() {
    if (command.value === null) {
      dialog.value = null;
      rejectionError.value = null;
    }
  }

  function publishOrder(order: OrderRecord) {
    orders.value = orders.value
      .map((row) => (row.id === order.id ? order : row))
      .filter(matchesQuery);

    if (selectedOrderId.value === order.id || detail.value?.id === order.id) {
      detail.value = order;
    }
  }

  function removeOrder(id: string) {
    orders.value = orders.value.filter((order) => order.id !== id);

    if (detail.value?.id === id) {
      detail.value = null;
    }
  }

  function matchesQuery(order: OrderRecord) {
    const current = query.value;

    if (current === null) {
      return false;
    }

    if (current.stage !== null) {
      return order.stage === current.stage;
    }

    return (
      current.view === "all" ||
      (order.rejection === null &&
        ORDER_STAGE_VIEWS[order.stage] === current.view)
    );
  }

  async function perform(id: string, action: OrderAction, reason = "") {
    const owner = context;
    const order = findOrder(id);

    if (owner === null || !active || commandsDisabled.value || order === null) {
      return;
    }

    if (
      order.rejection !== null ||
      !ORDER_ACTION_ALLOWED_STAGES[action].includes(order.stage)
    ) {
      return;
    }

    if (action === "reject" && reason.trim().length === 0) {
      return;
    }

    stopReads();
    const controller = new AbortController();
    const submitted: OrderCommand = { order, action, reason, phase: "sending" };

    commandController = controller;
    command.value = submitted;
    rejectionError.value = null;
    checkedOrder.value = null;
    message.value = null;
    const result = await sendOrderCommand(
      owner.accessToken,
      order,
      action,
      reason,
      controller.signal,
    );

    if (
      context !== owner ||
      commandController !== controller ||
      command.value !== submitted
    ) {
      return;
    }

    commandController = null;

    if (result.kind === "session-expired") {
      expireSession();

      return;
    }

    if (result.kind === "confirmed") {
      publishOrder(toOrderRecord(result.order));
      command.value = null;
      dialog.value = null;
      message.value = ORDER_MESSAGES.confirmed;
      await refresh();
      await loadSelectedOrder();

      return;
    }

    if (action === "reject") {
      // При ошибке отклонения сохраняем причину для формы без отдельной сверки.
      command.value = null;
      rejectionError.value =
        result.kind === "unknown"
          ? ORDER_MESSAGES.rejectionNoResponse
          : ORDER_MESSAGES.rejectionFailed;

      return;
    }

    if (result.kind === "not-found") {
      removeOrder(id);
      command.value = null;
      dialog.value = null;
      message.value = ORDER_MESSAGES.notFound;

      return;
    }

    if (result.kind === "rejected") {
      command.value = null;
      message.value = ORDER_MESSAGES.commandRejected;

      if (dialog.value?.orderId === id) {
        dialog.value = {
          ...dialog.value,
          error: ORDER_MESSAGES.commandRejected,
        };
      }

      return;
    }

    command.value = { ...submitted, phase: "unknown" };
    message.value =
      result.kind === "conflict"
        ? ORDER_MESSAGES.conflict
        : ORDER_MESSAGES.unknown;

    if (result.kind === "conflict" && intent.value.kind === "valid") {
      await checkCommand();
    }
  }

  async function submitDialog() {
    const target = dialog.value;

    if (target !== null) {
      await perform(target.orderId, target.mode, target.reason);
    }
  }

  async function checkCommand() {
    const owner = context;
    const submitted = command.value;

    if (
      owner === null ||
      submitted === null ||
      submitted.phase !== "unknown" ||
      reconciliationController !== null ||
      intent.value.kind !== "valid"
    ) {
      return;
    }

    const controller = new AbortController();
    const checking: OrderCommand = { ...submitted, phase: "checking" };

    stopReads();
    restorePhaseAfterReadStopped();
    command.value = checking;
    reconciliationController = controller;
    const result = await readOrder(
      owner.accessToken,
      submitted.order.id,
      controller.signal,
    );

    if (
      context !== owner ||
      reconciliationController !== controller ||
      command.value !== checking
    ) {
      return;
    }

    reconciliationController = null;

    if (result.kind === "session-expired") {
      expireSession();

      return;
    }

    if (result.kind === "loaded") {
      const current = toOrderRecord(result.order);

      // GET показывает текущее состояние, но не подтверждает авторство команды.
      publishOrder(current);
      checkedOrder.value = current;
      command.value = { ...submitted, phase: "reconciled" };
      message.value = ORDER_MESSAGES.reconciled;
    } else if (result.kind === "not-found") {
      removeOrder(submitted.order.id);
      command.value = { ...submitted, phase: "reconciled" };
      message.value = `${ORDER_MESSAGES.notFound} ${ORDER_MESSAGES.reconciled}`;
    } else {
      command.value = { ...submitted, phase: "unknown" };
      message.value = ORDER_MESSAGES.checkingFailed;
    }
  }

  async function finishReconciliation() {
    if (command.value?.phase !== "reconciled") {
      return;
    }

    command.value = null;
    dialog.value = null;
    checkedOrder.value = null;
    await refresh();
    await loadSelectedOrder();
  }

  function rememberScroll(position: number) {
    scrollPosition.value = position;
  }

  onScopeDispose(reset);

  return {
    orders: readonly(orders),
    phase: readonly(phase),
    message: readonly(message),
    rejectionError: readonly(rejectionError),
    readError: readonly(readError),
    sessionExpired: readonly(sessionExpired),
    intent: readonly(intent),
    view: readonly(view),
    command: readonly(command),
    dialog: readonly(dialog),
    selectedOrder,
    selectedOrderId,
    checkedOrder: readonly(checkedOrder),
    detailLoading: readonly(detailLoading),
    detailMessage: readonly(detailMessage),
    commandsDisabled,
    scrollPosition: readonly(scrollPosition),
    activate,
    deactivate,
    reset,
    refresh,
    selectView,
    selectOrder,
    loadSelectedOrder,
    openDialog,
    updateReason,
    closeDialog,
    perform,
    submitDialog,
    checkCommand,
    finishReconciliation,
    rememberScroll,
  };
});
