<template>
  <VDialog
    v-bind="dialogAttributes"
    :model-value="props.open"
    :width="dialogGeometry.width"
    :max-width="dialogGeometry.maxWidth"
    :persistent="props.persistent"
    :opacity="0.4"
    scrim="#000000"
    :transition="false"
    :content-props="contentProps"
    @update:model-value="requestClose"
  >
    <section v-bind="$attrs" class="operations-modal" :class="modalClass">
      <header class="operations-modal__header">
        <slot name="header" :title-id="titleId">
          <h2 :id="titleId" class="operations-modal__title">
            {{ props.title }}
          </h2>
          <p v-if="props.description" class="operations-modal__description">
            {{ props.description }}
          </p>
        </slot>
      </header>
      <div v-if="slots.default" class="operations-modal__body"><slot /></div>
      <footer v-if="slots.actions" class="operations-modal__actions">
        <slot name="actions" />
      </footer>
    </section>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onScopeDispose, shallowRef, useId } from "vue";
import { VDialog } from "vuetify/components/VDialog";
import {
  MODAL_CONTENT_STYLE,
  MODAL_MAX_WIDTH,
  MODAL_DEFAULTS,
  MOBILE_SHEET_QUERY,
  MODAL_SHEET_STYLE,
} from "./OperationsModal.constants";
import type {
  OperationsModalEmits,
  OperationsModalProps,
  OperationsModalSlots,
} from "./OperationsModal.types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<OperationsModalProps>(), MODAL_DEFAULTS);
const emit = defineEmits<OperationsModalEmits>();
const slots = defineSlots<OperationsModalSlots>();

const titleId = useId();
const dialogAttributes = { "aria-labelledby": titleId };
const matchesMobileViewport = shallowRef(false);
let stopWatchingViewport: (() => void) | null = null;

const sheetActive = computed(
  () => props.bottomSheet && matchesMobileViewport.value,
);

const dialogGeometry = computed(() => {
  if (sheetActive.value) {
    return {
      width: MODAL_SHEET_STYLE.width,
      maxWidth: MODAL_SHEET_STYLE.maxWidth,
      contentStyle: MODAL_SHEET_STYLE,
    };
  }

  return {
    width: props.width,
    maxWidth: MODAL_MAX_WIDTH,
    contentStyle: MODAL_CONTENT_STYLE,
  };
});

const modalClass = computed(() => [
  `operations-modal--${props.layout}`,
  { "operations-modal--sheet": sheetActive.value },
]);
const contentProps = computed(() => ({
  style: dialogGeometry.value.contentStyle,
  "aria-labelledby": titleId,
}));

onMounted(watchMobileViewport);
onScopeDispose(() => {
  stopWatchingViewport?.();
});

function watchMobileViewport() {
  const mobileQuery = globalThis.matchMedia(MOBILE_SHEET_QUERY);
  const syncViewportMatch = () => {
    matchesMobileViewport.value = mobileQuery.matches;
  };

  syncViewportMatch();
  mobileQuery.addEventListener("change", syncViewportMatch);
  stopWatchingViewport = () => {
    mobileQuery.removeEventListener("change", syncViewportMatch);
  };
}

function requestClose(open: boolean) {
  // VDialog сообщает запрос закрытия; значение open меняет только потребитель.
  if (!open) {
    emit("close");
  }
}
</script>

<style scoped>
/* Внутренние отступы и шрифт принадлежат исходной оболочке диалога; tokens
   для них нет. Ширину overlay выбирает dialogGeometry, цвета и радиус — тема. */
.operations-modal {
  width: 100%;
  padding: 24px;
  overflow-y: auto;
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
/* Заголовок отделён от содержимого собственными интервалами оболочки;
   они не задают отступы форм, переданных через slots. */
.operations-modal__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}
/* Подтверждение компактнее формы; это локальный вариант той же оболочки. */
.operations-modal--confirmation .operations-modal__header {
  padding-bottom: 16px;
}
/* Пара заголовок/описание сохраняет исходную иерархию диалога;
   общей типографической шкалы в текущих tokens нет. */
.operations-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.operations-modal__description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}
/* Интервалы body и actions относятся к раскладке slots, а не к полям внутри них;
   отдельных tokens для этих расстояний нет. */
.operations-modal__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 24px;
}
.operations-modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

/* Тот же компактный интервал отделяет содержимое подтверждения от действий. */
.operations-modal--confirmation .operations-modal__body {
  padding-bottom: 16px;
}

/* Внутренняя прокручиваемая поверхность ограничена той же высотой viewport,
   что и внешний MODAL_SHEET_STYLE; фиксированная высота экрана здесь не нужна. */
.operations-modal--sheet {
  max-height: 100dvh;
}
</style>
