<template>
  <section class="slot-picker" aria-labelledby="pickup-title">
    <header class="slot-picker__header">
      <UiBtn
        class="slot-picker__back"
        :disabled="props.busy"
        @click="emit('back')"
      >
        <img :src="backIcon" width="20" height="20" alt="" />В корзину
      </UiBtn>
      <h1 id="pickup-title">Выберите время</h1>
    </header>
    <div class="slot-picker__surface">
      <div class="slot-picker__times">
        <p class="slot-picker__day">Сегодня <span>· UTC</span></p>
        <div class="slot-picker__list" :aria-busy="props.loading">
          <p v-if="props.loading" role="status">Загружаем время получения…</p>
          <div
            v-else-if="props.message"
            class="slot-picker__state"
            role="status"
          >
            <p>{{ props.message }}</p>
            <UiBtn
              class="slot-picker__refresh"
              :disabled="props.locked"
              @click="emit('refresh')"
              >Обновить</UiBtn
            >
          </div>
          <div
            v-else
            class="slot-picker__options"
            role="group"
            aria-label="Время получения, UTC"
          >
            <SlotOption
              value="automatic"
              label="Как можно скорее"
              :selected="props.selection === 'automatic'"
              :available="true"
              :disabled="props.locked"
              @select="emit('select', $event)"
            />
            <SlotOption
              v-for="choice in props.choices"
              :key="choice.startsAt"
              :value="choice.startsAt"
              :label="choice.label"
              :available="choice.available"
              :selected="props.selection === choice.startsAt"
              :disabled="props.locked"
              @select="emit('select', $event)"
            />
          </div>
        </div>
      </div>
      <footer class="slot-picker__footer">
        <UiBtn
          color="primary"
          class="slot-picker__confirm"
          :disabled="!props.canSubmit"
          :loading="props.busy"
          @click="emit('confirm')"
          >{{ props.busy ? "Оформляем…" : "Оформить заказ" }}
          <template #loader>Оформляем…</template>
        </UiBtn>
      </footer>
    </div>
    <UiNotification
      :message="props.notification"
      role="alert"
      @close="emit('dismissNotification')"
    />
  </section>
</template>

<script setup lang="ts">
import UiBtn from "@/shared/ui/customer/btn/UiBtn.vue";
import UiNotification from "@/shared/ui/customer/notification/UiNotification.vue";
import backIcon from "./assets/back.svg";
import SlotOption from "./SlotOption.vue";
import type {
  SlotPickerScreenEmits,
  SlotPickerScreenProps,
} from "./SlotPickerScreen.types";

const props = defineProps<SlotPickerScreenProps>();
const emit = defineEmits<SlotPickerScreenEmits>();
</script>

<style scoped>
.slot-picker {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-7);
  width: 100%;
  max-width: 55rem; /* Ширина области 880px принятого макета; отдельного токена нет. */
  height: calc(100dvh - var(--customer-size-shell-header));
  min-height: 0;
  padding: var(--customer-space-9);
  color: var(--customer-text);
}
.slot-picker__header {
  flex: 0 0 auto;
}
.slot-picker__back {
  display: flex;
  gap: var(--customer-space-5);
  font-size: var(--customer-font-size-sm);
  font-weight: var(--customer-font-weight-bold);
}
.slot-picker h1 {
  margin: var(--customer-space-5) 0 0;
  font-size: var(--customer-font-size-page-heading);
  font-weight: var(--customer-font-weight-page-heading);
  line-height: var(--customer-line-height-page-heading);
}
.slot-picker__surface {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-9);
  min-height: 0;
  padding: var(--customer-space-9);
  color: var(--customer-text-on-surface);
  background: var(--customer-surface);
  border-radius: var(--customer-radius-xl);
}
.slot-picker__times {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--customer-space-9);
  min-height: 0;
}
.slot-picker__day {
  margin: 0;
  font-weight: var(--customer-font-weight-extrabold);
}
.slot-picker__day span {
  font-weight: var(--customer-font-weight-semibold);
  color: var(--customer-color-text-secondary-on-surface);
}
.slot-picker__list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 2px;
}
.slot-picker__options {
  display: flex;
  flex-direction: column;
  gap: var(--customer-space-7);
}
.slot-picker__state p {
  margin: 0 0 var(--customer-space-7);
}
.slot-picker__refresh {
  min-width: 44px;
  padding: 0 var(--customer-space-9);
  background: var(--customer-color-blue-500-10);
}
.slot-picker__footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-top: var(--customer-space-9);
  border-top: 1px solid var(--customer-border-subtle-on-surface);
}
.slot-picker__confirm {
  width: 100%;
  min-height: var(--customer-size-control-xl);
  padding: var(--customer-space-7);
  font-weight: var(--customer-font-weight-extrabold);
}
@media (min-width: 768px) {
  .slot-picker {
    padding: var(--customer-space-13) var(--customer-space-9)
      var(--customer-space-9);
  }
  .slot-picker__surface {
    padding: var(--customer-space-11);
  }
  .slot-picker__confirm {
    width: 18.25rem; /* Ширина кнопки подтверждения принятого макета; отдельного токена нет. */
  }
}
@media (min-width: 1024px) {
  .slot-picker {
    height: calc(100dvh - var(--customer-space-9));
    padding: var(--customer-space-17) 0 var(--customer-space-13);
  }
}
@media (min-width: 1024px) {
  .slot-picker__surface {
    flex: 0 1 auto;
  }
  .slot-picker__list {
    max-height: 520px; /* Высота видимой области списка на настольном экране из принятого макета; отдельного токена нет. */
  }
}
@media (max-width: 1023px) {
  .slot-picker__surface {
    padding: 0;
    background: transparent;
  }
  .slot-picker__times {
    padding: var(--customer-space-9);
    background: var(--customer-surface);
    border-radius: var(--customer-radius-xl);
  }
  .slot-picker__footer {
    padding: var(--customer-space-9);
    border: 0;
    background: var(--customer-surface);
    border-radius: var(--customer-radius-xl);
  }
  .slot-picker {
    padding-bottom: max(var(--customer-space-9), env(safe-area-inset-bottom));
  }
}
</style>
