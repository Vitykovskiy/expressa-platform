import { computed, readonly, ref } from "vue";
import { defineStore } from "pinia";
import { ApiFailure } from "../../shared/api/transport";
import { useSessionStore } from "../session/session.store";
import { changeAvailability, readAvailability } from "./availability.api";
import type {
  Availability,
  AvailabilityIntent,
  AvailabilityOperation,
} from "./availability.types";

export const useAvailabilityStore = defineStore("availability", () => {
  const session = useSessionStore();
  const data = ref<Availability | null>(null);
  const fresh = ref(false);
  const pending = ref(false);
  const error = ref("");
  const operation = ref<AvailabilityOperation | null>(null);
  const locked = computed(
    () =>
      operation.value !== null &&
      operation.value.status !== "completed" &&
      operation.value.status !== "reconciled",
  );
  let generation = 0;
  const freshnessEpoch = ref(0);
  let ordinary: AbortController | null = null;
  let recovery: AbortController | null = null;

  function cancelRead() {
    ordinary?.abort();
    ordinary = null;
    pending.value = false;
  }

  function clear() {
    generation += 1;
    freshnessEpoch.value += 1;
    cancelRead();
    recovery?.abort();
    recovery = null;
    data.value = null;
    operation.value = null;
    fresh.value = false;
    error.value = "";
  }

  function invalidateCatalog() {
    freshnessEpoch.value += 1;
    cancelRead();
    fresh.value = false;
  }

  async function refresh() {
    if (
      ordinary !== null ||
      locked.value ||
      session.busy ||
      session.status !== "staff"
    )
      return;

    const controller = new AbortController();
    const version = generation;
    const freshness = freshnessEpoch.value;

    ordinary = controller;
    pending.value = true;

    try {
      const current = await session.authenticatedGet((token) =>
        readAvailability(token, controller.signal),
      );

      if (
        ordinary === controller &&
        !controller.signal.aborted &&
        version === generation &&
        freshness === freshnessEpoch.value
      ) {
        data.value = current;
        fresh.value = true;
        error.value = "";
        operation.value = null;
      }
    } catch {
      if (
        ordinary === controller &&
        version === generation &&
        !controller.signal.aborted
      ) {
        fresh.value = false;
        error.value =
          data.value === null
            ? "Не удалось загрузить доступность"
            : "Не удалось обновить доступность";
      }
    } finally {
      if (ordinary === controller) {
        ordinary = null;
        pending.value = false;
      }
    }
  }

  function findTarget(intent: AvailabilityIntent) {
    const current = data.value;

    if (current === null) return null;
    if (intent.kind === "intake")
      return {
        label: "Принимать новые заказы",
        previous: current.intake.acceptsNewOrders,
      };

    for (const category of current.categories) {
      for (const product of category.products) {
        if (intent.kind === "product" && product.id === intent.id)
          return {
            label: `${category.label}: ${product.label}`,
            previous: product.isAvailable,
          };

        const choice = product.choices.find((item) => item.id === intent.id);

        if (intent.kind === "price_choice" && choice !== undefined)
          return {
            label: `${category.label}: ${product.label}, ${choice.label}`,
            previous: choice.isAvailable,
          };
      }
    }

    for (const group of current.groups) {
      const option = group.options.find((item) => item.id === intent.id);

      if (intent.kind === "modifier" && option !== undefined)
        return {
          label: `${group.label}: ${option.label}`,
          previous: option.isAvailable,
        };
    }

    return null;
  }

  async function change(intent: AvailabilityIntent) {
    if (
      locked.value ||
      !fresh.value ||
      session.busy ||
      session.status !== "staff" ||
      data.value === null
    )
      return;

    const target = findTarget(intent);

    if (target === null || target.previous === intent.requested) return;

    cancelRead();
    const version = ++generation;
    const original: AvailabilityOperation = {
      ...intent,
      ...target,
      status: "sending",
      message: "Сохранение…",
    };
    let sent = false;

    operation.value = original;

    try {
      const response = await session.authenticatedCommand((token) => {
        sent = true;

        return changeAvailability(token, original);
      });

      if (
        version !== generation ||
        session.status !== "staff" ||
        data.value === null
      )
        return;

      if (typeof response !== "boolean") {
        data.value.intake = response;
      } else {
        const current = data.value;

        for (const category of current.categories) {
          for (const product of category.products) {
            if (original.kind === "product" && product.id === original.id)
              product.isAvailable = response;

            for (const choice of product.choices) {
              if (original.kind === "price_choice" && choice.id === original.id)
                choice.isAvailable = response;
            }
          }
        }

        for (const group of current.groups) {
          for (const option of group.options) {
            if (original.kind === "modifier" && option.id === original.id)
              option.isAvailable = response;
          }
        }
      }

      operation.value = {
        ...original,
        status: "completed",
        message: `${original.kind === "intake" ? "Приём заказов обновлён" : "Доступность обновлена"}: ${original.requested ? "Да" : "Нет"}`,
      };
    } catch (failure) {
      if (version !== generation || session.status !== "staff") return;

      const definite =
        original.kind !== "price_choice" &&
        failure instanceof ApiFailure &&
        failure.kind === "http" &&
        (failure.status === 400 || failure.status === 404);
      const absent = definite && failure.status === 404;
      const unknown = sent && !definite;

      fresh.value = false;
      operation.value = {
        ...original,
        status: unknown ? "unknown" : absent ? "absent" : "failed",
        message: unknown
          ? "Результат изменения не подтверждён"
          : absent
            ? "Позиция недоступна"
            : original.kind === "intake"
              ? "Не удалось изменить приём заказов"
              : "Не удалось изменить доступность",
      };
    }
  }

  async function reconcile() {
    const original = operation.value;

    if (
      original === null ||
      !locked.value ||
      original.status === "sending" ||
      recovery !== null ||
      session.busy ||
      session.status !== "staff"
    )
      return;

    cancelRead();
    const controller = new AbortController();
    const version = generation;
    const freshness = freshnessEpoch.value;

    recovery = controller;
    operation.value = {
      ...original,
      status: "reconciling",
      message:
        original.kind === "intake"
          ? "Проверяем приём"
          : "Проверяем доступность",
    };

    try {
      const current = await session.authenticatedGet((token) =>
        readAvailability(token, controller.signal),
      );

      if (
        version !== generation ||
        controller.signal.aborted ||
        session.status !== "staff"
      )
        return;

      if (freshness !== freshnessEpoch.value) {
        operation.value = {
          ...original,
          status: "unknown",
          message: "Каталог изменился. Проверьте доступность",
        };

        return;
      }

      data.value = current;
      fresh.value = true;
      error.value = "";
      operation.value = {
        ...original,
        status: "reconciled",
        message: "Данные обновлены",
      };
    } catch {
      if (
        version === generation &&
        session.status === "staff" &&
        !controller.signal.aborted
      ) {
        operation.value = {
          ...original,
          status: "unknown",
          message:
            original.kind === "intake"
              ? "Не удалось проверить приём"
              : "Не удалось проверить доступность",
        };
      }
    } finally {
      if (recovery === controller) recovery = null;
    }
  }

  return {
    data: computed(() => (data.value === null ? null : readonly(data.value))),
    operation: computed(() =>
      operation.value === null ? null : readonly(operation.value),
    ),
    fresh: computed(() => fresh.value),
    catalogEpoch: computed(() => freshnessEpoch.value),
    loading: computed(() => pending.value),
    error: computed(() => error.value),
    locked,
    refresh,
    change,
    reconcile,
    cancelRead,
    clear,
    invalidateCatalog,
  };
});
