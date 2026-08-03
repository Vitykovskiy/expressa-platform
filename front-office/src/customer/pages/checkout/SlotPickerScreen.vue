<template>
  <section
    class="slot-picker"
    aria-labelledby="slot-picker-title"
    :aria-busy="loading"
  >
    <header class="slot-picker__header">
      <p class="slot-picker__eyebrow">Pickup</p>
      <h1 id="slot-picker-title" class="slot-picker__title">Выбор времени</h1>
      <p class="slot-picker__description">
        Выберите удобный слот для выдачи заказа.
      </p>
    </header>

    <p
      v-if="errorMessage"
      class="slot-picker__message slot-picker__message--error"
      role="alert"
    >
      <AlertCircle :size="16" aria-hidden="true" />
      {{ errorMessage }}
    </p>
    <p
      v-if="loading"
      class="slot-picker__message"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        class="slot-picker__spinner"
        :size="18"
        :stroke-width="3"
        aria-hidden="true"
      />
      Создаём заказ...
    </p>

    <ul class="slot-picker__slots" aria-label="Временные слоты">
      <li v-for="slot in slots" :key="slot.id">
        <SlotOption
          :time-slot="slot"
          :selected="selectedSlotId === slot.id"
          :disabled="loading"
          @select="selectSlot"
        />
      </li>
    </ul>

    <footer class="slot-picker__footer">
      <ui-btn
        type="button"
        class="slot-picker__confirm"
        :disabled="loading"
        @click="confirm"
      >
        {{ loading ? "Подтверждаем..." : "Подтвердить заказ" }}
      </ui-btn>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { AlertCircle, LoaderCircle } from "lucide-vue-next";
import UiBtn from "../../shared/ui/btn/UiBtn.vue";
import SlotOption from "./SlotOption.vue";
import type {
  SlotPickerScreenEmits,
  SlotPickerScreenProps,
} from "./SlotPickerScreen.types";

const props = withDefaults(defineProps<SlotPickerScreenProps>(), {
  loading: false,
  errorMessage: "",
});
const emit = defineEmits<SlotPickerScreenEmits>();

const localError = ref("");
const selectedSlot = computed(
  () => props.slots.find((slot) => slot.id === props.selectedSlotId) ?? null,
);
const errorMessage = computed(() => props.errorMessage || localError.value);

watch(
  () => props.selectedSlotId,
  () => {
    localError.value = "";
  },
);

function selectSlot(slotId: string): void {
  if (props.loading) return;
  emit("selectSlot", slotId);
}

function confirm(): void {
  if (props.loading) return;
  if (!selectedSlot.value) {
    localError.value = "Пожалуйста, выберите временной слот.";
    return;
  }
  localError.value = "";
  emit("confirm", selectedSlot.value.id);
}
</script>

<style scoped lang="scss">
.slot-picker {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  color: var(--customer-text);
  background: var(--customer-background);
}

.slot-picker__header {
  padding: var(--customer-space-13) var(--customer-space-9)
    var(--customer-space-15);
}

.slot-picker__eyebrow {
  margin: 0 0 var(--customer-space-4);
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-xs);
  font-weight: var(--customer-font-weight-bold);
  letter-spacing: var(--customer-letter-spacing-overline);
  text-transform: uppercase;
}

.slot-picker__title {
  margin: 0 0 var(--customer-space-5);
  font-size: var(--customer-font-size-display);
  font-weight: var(--customer-font-weight-black);
  letter-spacing: var(--customer-letter-spacing-tight);
  line-height: var(--customer-line-height-tight);
}

.slot-picker__description {
  margin: 0;
  color: var(--customer-color-text-muted-on-brand);
  font-size: var(--customer-font-size-body);
  font-weight: var(--customer-font-weight-semibold);
}

.slot-picker__message {
  display: flex;
  align-items: center;
  gap: var(--customer-space-7);
  margin: var(--customer-space-11) var(--customer-space-9) 0;
  padding: var(--customer-space-8) var(--customer-space-9);
  background: var(--customer-color-surface-subtle);
  border: 1px solid var(--customer-border);
  border-radius: var(--customer-radius);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}

.slot-picker__message--error {
  color: var(--customer-danger-pale);
  background: var(--customer-danger-10);
  border-color: var(--customer-error);
}

.slot-picker__spinner {
  animation: slot-picker-spin var(--customer-duration-base) linear infinite;
}

.slot-picker__slots {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-5);
  margin: 0;
  padding: var(--customer-space-11) var(--customer-space-9)
    var(--customer-space-9);
  list-style: none;
}

.slot-picker__footer {
  position: sticky;
  bottom: 0;
  padding: var(--customer-space-9);
  background: var(--customer-background);
  border-top: 1px solid var(--customer-border);
}

.slot-picker__confirm {
  width: 100%;
  min-height: var(--customer-size-control-xl);
  color: var(--customer-text);
  background: var(--customer-primary);
  border-radius: var(--customer-radius);
  font-size: var(--customer-font-size-lg);
  font-weight: var(--customer-font-weight-black);
}

@keyframes slot-picker-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 1024px) {
  .slot-picker__header {
    padding: var(--customer-space-13) var(--customer-space-16)
      var(--customer-space-15);
  }

  .slot-picker__message {
    margin-right: var(--customer-space-16);
    margin-left: var(--customer-space-16);
  }

  .slot-picker__slots {
    max-width: var(--customer-size-content-detail);
    padding-right: var(--customer-space-16);
    padding-left: var(--customer-space-16);
  }

  .slot-picker__footer {
    padding: var(--customer-space-9) var(--customer-space-16);
  }
}
</style>
