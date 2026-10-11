import { computed, readonly, ref } from "vue";
import { defineStore } from "pinia";
import { ApiFailure } from "../../shared/api/transport";
import { useSessionStore } from "../session/session.store";
import { listOrders, readOrder, transitionOrder } from "./order.api";
import { nextOrderAction, stageLabels } from "./order.constants";
import type {
  Order,
  OrderFilters,
  OrderOperation,
  OrderTransition,
} from "./order.types";

export const useOrderStore = defineStore("orders", () => {
  const session = useSessionStore();
  const rows = ref<Order[] | null>(null);
  const selected = ref<Order | null>(null);
  const listPending = ref(false);
  const detailPending = ref(false);
  const listError = ref("");
  const detailError = ref("");
  const lastListUpdate = ref<string | null>(null);
  const lastDetailUpdate = ref<string | null>(null);
  const operation = ref<OrderOperation | null>(null);
  const commandLocked = computed(
    () =>
      operation.value !== null &&
      operation.value.status !== "completed" &&
      operation.value.status !== "reconciled" &&
      operation.value.status !== "absent",
  );
  let operationVersion = 0;
  let reconciliation: AbortController | null = null;
  let filters: OrderFilters = { number: null, stage: null };
  let selectedId: string | null = null;
  let listRequest: AbortController | null = null;
  let detailRequest: AbortController | null = null;

  function cancelRequests() {
    listRequest?.abort();
    detailRequest?.abort();
    listRequest = null;
    detailRequest = null;
    listPending.value = false;
    detailPending.value = false;
  }

  function clear() {
    cancelRequests();
    operationVersion += 1;
    reconciliation?.abort();
    reconciliation = null;
    operation.value = null;
    rows.value = null;
    selected.value = null;
    selectedId = null;
    listError.value = "";
    detailError.value = "";
    lastListUpdate.value = null;
    lastDetailUpdate.value = null;
  }

  async function refreshList() {
    if (
      listRequest !== null ||
      commandLocked.value ||
      session.status !== "staff"
    ) {
      return;
    }

    const controller = new AbortController();
    const query = { ...filters };

    listRequest = controller;
    listPending.value = true;

    try {
      const data = await session.authenticatedGet((token) =>
        listOrders(token, query, controller.signal),
      );

      if (listRequest === controller && !controller.signal.aborted) {
        rows.value = data;
        listError.value = "";
        lastListUpdate.value = new Date().toISOString();
      }
    } catch (error) {
      if (
        listRequest === controller &&
        !(error instanceof ApiFailure && error.kind === "aborted")
      ) {
        listError.value =
          error instanceof ApiFailure && error.kind === "contract"
            ? "Ответ сервера не соответствует контракту"
            : "Не удалось обновить данные";
      }
    } finally {
      if (listRequest === controller) {
        listRequest = null;
        listPending.value = false;
      }
    }
  }

  async function refreshDetail() {
    if (
      detailRequest !== null ||
      commandLocked.value ||
      selectedId === null ||
      session.status !== "staff"
    ) {
      return;
    }

    const controller = new AbortController();
    const id = selectedId;

    detailRequest = controller;
    detailPending.value = true;

    try {
      const data = await session.authenticatedGet((token) =>
        readOrder(token, id, controller.signal),
      );

      if (
        detailRequest === controller &&
        !controller.signal.aborted &&
        selectedId === id
      ) {
        selected.value = data;
        detailError.value = "";
        lastDetailUpdate.value = new Date().toISOString();
      }
    } catch (error) {
      if (
        detailRequest === controller &&
        !(error instanceof ApiFailure && error.kind === "aborted")
      ) {
        if (error instanceof ApiFailure && error.status === 404) {
          selected.value = null;
          detailError.value = "Заказ недоступен";
        } else {
          detailError.value =
            error instanceof ApiFailure && error.kind === "contract"
              ? "Ответ сервера не соответствует контракту"
              : "Не удалось обновить данные";
        }
      }
    } finally {
      if (detailRequest === controller) {
        detailRequest = null;
        detailPending.value = false;
      }
    }
  }

  async function applyFilters(value: OrderFilters) {
    listRequest?.abort();
    listRequest = null;
    filters = { ...value };
    rows.value = null;
    lastListUpdate.value = null;
    listError.value = "";

    await refreshList();
  }

  async function select(id: string | null) {
    if (selectedId === id) {
      return;
    }

    if (operation.value !== null && !commandLocked.value) {
      operation.value = null;
    }

    detailRequest?.abort();
    detailRequest = null;
    selectedId = id;
    selected.value = null;
    detailError.value = "";
    lastDetailUpdate.value = null;
    detailPending.value = false;

    await refreshDetail();
  }

  async function refresh() {
    await Promise.all([refreshList(), refreshDetail()]);
  }

  function publishOrder(order: Order) {
    if (selectedId === order.id) {
      selected.value = order;
      detailError.value = "";
      lastDetailUpdate.value = new Date().toISOString();
    }
  }

  async function transition(context: OrderTransition) {
    if (
      commandLocked.value ||
      session.busy ||
      session.status !== "staff" ||
      selected.value === null ||
      selectedId !== context.id ||
      selected.value.id !== context.id ||
      selected.value.stage !== context.from ||
      nextOrderAction[context.from] !== context.action ||
      detailError.value !== ""
    ) {
      return;
    }

    cancelRequests();
    const version = ++operationVersion;
    const original: OrderOperation = {
      ...context,
      number: selected.value.number,
      status: "sending",
      message: "",
    };
    let sent = false;

    operation.value = original;

    try {
      const order = await session.authenticatedCommand((token) => {
        const actorId = session.user?.id;

        if (actorId === undefined) {
          throw new ApiFailure("aborted");
        }

        sent = true;

        return transitionOrder(token, context, actorId);
      });

      if (version !== operationVersion || session.status !== "staff") {
        return;
      }

      publishOrder(order);
      operation.value = { ...original, status: "completed", message: "" };
      await refresh();
    } catch (error) {
      if (version !== operationVersion || session.status !== "staff") {
        return;
      }

      const definitive = error instanceof ApiFailure && error.kind === "http";

      if (definitive && error.status === 404) {
        if (selectedId === context.id) {
          selected.value = null;
          detailError.value = "";
        }

        operation.value = {
          ...original,
          status: "absent",
          message: "Заказ недоступен",
        };
        await refreshList();
      } else if (definitive && error.status === 409) {
        operation.value = {
          ...original,
          status: "conflict",
          message: "Стадия заказа изменилась",
        };
        await reconcile();
      } else if (!sent || (definitive && error.status === 400)) {
        operation.value = {
          ...original,
          status: "failed",
          message: "Не удалось выполнить действие",
        };
      } else {
        operation.value = {
          ...original,
          status: "unknown",
          message: "Результат действия не подтверждён",
        };
        await reconcile();
      }
    }
  }

  async function reconcile() {
    const original = operation.value;

    if (
      original === null ||
      reconciliation !== null ||
      original.status === "sending" ||
      original.status === "completed" ||
      original.status === "reconciled" ||
      original.status === "absent" ||
      session.status !== "staff" ||
      session.busy
    ) {
      return;
    }

    cancelRequests();
    const version = operationVersion;
    const controller = new AbortController();

    reconciliation = controller;
    operation.value = {
      ...original,
      status: "reconciling",
      message: "Проверяем заказ",
    };

    try {
      const order = await session.authenticatedGet((token) =>
        readOrder(token, original.id, controller.signal),
      );

      if (version !== operationVersion || controller.signal.aborted) {
        return;
      }

      publishOrder(order);
      operation.value = {
        ...original,
        status: "reconciled",
        message: `Текущая стадия: ${stageLabels[order.stage]}`,
      };
      await refresh();
    } catch (error) {
      if (version !== operationVersion || session.status !== "staff") {
        return;
      }

      if (
        error instanceof ApiFailure &&
        error.kind === "http" &&
        error.status === 404
      ) {
        if (selectedId === original.id) {
          selected.value = null;
          detailError.value = "";
        }

        operation.value = {
          ...original,
          status: "absent",
          message: "Заказ недоступен",
        };
        await refreshList();
      } else {
        operation.value = {
          ...original,
          status: "unknown",
          message: "Не удалось проверить заказ",
        };
      }
    } finally {
      if (reconciliation === controller) {
        reconciliation = null;
      }
    }
  }

  return {
    orders: computed(() => (rows.value === null ? null : readonly(rows.value))),
    detail: computed(() =>
      selected.value === null ? null : readonly(selected.value),
    ),
    loading: computed(() => listPending.value),
    detailLoading: computed(() => detailPending.value),
    error: computed(() => listError.value),
    detailError: computed(() => detailError.value),
    updatedAt: computed(() => lastListUpdate.value),
    detailUpdatedAt: computed(() => lastDetailUpdate.value),
    operation: computed(() =>
      operation.value === null ? null : readonly(operation.value),
    ),
    commandLocked,
    transition,
    reconcile,
    applyFilters,
    select,
    refresh,
    refreshDetail,
    cancelRequests,
    clear,
  };
});
