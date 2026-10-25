<template>
  <div class="source-toast" role="status" aria-live="polite">
    <div class="source-toast__icon-box">
      <img class="source-toast__icon" :src="icon" alt="" />
    </div>
    <p class="source-toast__message">{{ props.message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TOAST_ICONS } from "./SourceToast.constants";
import type { SourceToastProps } from "./SourceToast.types";

const props = defineProps<SourceToastProps>();
const icon = computed(() => TOAST_ICONS[props.type]);
</script>

<style scoped>
/* Ширина и интервалы сохраняют исходную компоновку toast; в теме для них нет
   tokens. Цвета, рамка, радиус и тень остаются под управлением темы. */
.source-toast {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 356px;
  padding: 16px;
  overflow: clip;
  border: 1px solid var(--toast-border);
  border-radius: var(--toast-radius);
  background: var(--toast-surface);
  color: var(--toast-foreground);
  box-shadow: var(--toast-shadow);
  font-family: Inter, sans-serif;
}

/* Место в строке уже самого SVG: оба файла из TOAST_ICONS имеют размер 20×20.
   Этот блок резервирует место, но не обрезает выступающий рисунок. */
.source-toast__icon-box {
  position: relative;
  flex-shrink: 0;
  width: 17px;
  height: 16px;
}

/* Смещения сохраняют положение исходных SVG относительно текста. max-width
   не даёт стилям изображений сжать их до ширины резервирующего блока. */
.source-toast__icon {
  position: absolute;
  top: -2px;
  left: -4px;
  display: block;
  max-width: none;
}

/* У toast собственная плотность текста без типографического token в теме.
   Минимальная ширина и перенос позволяют длинному сообщению сжиматься во flex. */
.source-toast__message {
  flex: 1 0 0;
  min-width: 1px;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 500;
  line-height: 19.5px;
}

/* Узкий вариант toast использует собственный breakpoint и боковые поля;
   он не связан с переходом рабочих диалогов в bottom sheet. */
@media (max-width: 600px) {
  .source-toast {
    width: calc(100vw - 32px);
  }
}
</style>
