import { computed, onUnmounted, readonly, shallowRef } from "vue";
import type { PickupAvailability } from "@/shared/api/pickup-slots.api.types";
import type { PickupSelectionDependencies } from "./usePickupSelection.types";

/** Выбор живёт отдельно от неизменяемой попытки отправки заказа. */
export function usePickupSelection(dependencies: PickupSelectionDependencies) {
  const availability = shallowRef<PickupAvailability | null>(null);
  const loading = shallowRef(false);
  const readFailed = shallowRef(false);
  const selection = shallowRef<string | null>(null);
  const rejectedStart = shallowRef<string | null>(null);
  const recoveringConflict = shallowRef(false);
  let loadVersion = 0;

  const choices = computed(() =>
    (availability.value?.choices ?? []).map((choice) => ({
      ...choice,
      available: choice.available && choice.startsAt !== rejectedStart.value,
    })),
  );
  const hasCapacity = computed(() =>
    choices.value.some((choice) => choice.available),
  );
  const message = computed(() => {
    if (readFailed.value) {
      return "Не удалось загрузить время получения. Попробуйте ещё раз.";
    }

    if (availability.value?.acceptsNewOrders === false) {
      return "Сейчас не принимаем заказы.";
    }

    if (!loading.value && !hasCapacity.value) {
      return "На сегодня свободного времени нет. Попробуйте в другой рабочий день.";
    }

    return null;
  });
  const canSubmit = computed(() => {
    if (
      dependencies.locked.value ||
      loading.value ||
      message.value !== null ||
      selection.value === null
    ) {
      return false;
    }

    return (
      selection.value === "automatic" ||
      choices.value.some(
        (choice) => choice.startsAt === selection.value && choice.available,
      )
    );
  });

  onUnmounted(() => {
    loadVersion += 1;
  });

  async function load(): Promise<void> {
    if (dependencies.locked.value) {
      return;
    }

    const version = ++loadVersion;

    loading.value = true;
    readFailed.value = false;
    selection.value = null;
    try {
      const result = await dependencies.loadAvailability();

      if (version !== loadVersion) {
        return;
      }

      availability.value = result;
      const bookable =
        result.acceptsNewOrders &&
        result.choices.some(
          (choice) =>
            choice.available && choice.startsAt !== rejectedStart.value,
        );

      if (bookable && !recoveringConflict.value) {
        selection.value = "automatic";
      }
    } catch {
      if (version !== loadVersion) {
        return;
      }

      availability.value = null;
      readFailed.value = true;
    } finally {
      if (version === loadVersion) {
        loading.value = false;
      }
    }
  }

  function select(value: string): void {
    if (dependencies.locked.value || loading.value || message.value !== null) {
      return;
    }

    if (
      value !== "automatic" &&
      !choices.value.some(
        (choice) => choice.startsAt === value && choice.available,
      )
    ) {
      return;
    }

    selection.value = value;
  }

  async function recoverConflict(requestedStart: string | null): Promise<void> {
    rejectedStart.value =
      requestedStart === "automatic" ? null : requestedStart;
    selection.value = null;
    recoveringConflict.value = true;
    await load();
  }

  return {
    choices,
    loading: readonly(loading),
    selection: readonly(selection),
    message,
    canSubmit,
    load,
    select,
    recoverConflict,
  };
}
