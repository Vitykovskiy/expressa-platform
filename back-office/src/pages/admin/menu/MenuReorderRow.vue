<template>
  <div
    class="menu-reorder-row"
    :class="{ 'menu-reorder-row--grabbed': grabbed }"
  >
    <AdminButton
      class="menu-reorder-row__handle"
      type="button"
      variant="ghost"
      size="compact"
      :disabled="props.disabled"
      :data-reorder-control="`${props.id}:handle`"
      @pointerdown="startPointer"
      @pointermove="movePointer"
      @pointerup="dropPointer"
      @pointercancel="cancelDrag"
    >
      <AdminIcon :icon="GripVertical" />
    </AdminButton>
    <AdminButton
      v-if="props.disclosable"
      class="menu-reorder-row__disclosure"
      type="button"
      variant="ghost"
      size="compact"
      :disabled="props.disabled"
      @click="emit('toggle')"
    >
      <AdminIcon :icon="props.expanded ? ChevronDown : ChevronRight" />
    </AdminButton>
    <AdminButton
      class="menu-reorder-row__label"
      :class="{ 'menu-reorder-row__label--truncated': isTruncated }"
      type="button"
      variant="ghost"
      size="compact"
      :disabled="props.disabled"
      @click="openLabel"
      ><span ref="labelText" class="menu-reorder-row__label-text">{{
        props.label
      }}</span></AdminButton
    >
    <AdminButton
      type="button"
      variant="ghost"
      size="compact"
      :disabled="props.disabled || !props.canMoveUp"
      :data-reorder-control="`${props.id}:up`"
      @click="emit('move', { offset: -1, control: 'up' })"
    >
      <AdminIcon :icon="ChevronUp" />
    </AdminButton>
    <AdminButton
      type="button"
      variant="ghost"
      size="compact"
      :disabled="props.disabled || !props.canMoveDown"
      :data-reorder-control="`${props.id}:down`"
      @click="emit('move', { offset: 1, control: 'down' })"
    >
      <AdminIcon :icon="ChevronDown" />
    </AdminButton>
  </div>
</template>
<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
} from "lucide-vue-next";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import type {
  MenuReorderRowEmits,
  MenuReorderRowProps,
} from "./MenuReorderRow.types";
const props = withDefaults(defineProps<MenuReorderRowProps>(), {
  disabled: false,
});
const emit = defineEmits<MenuReorderRowEmits>();
const grabbed = ref(false);
const labelText = ref<HTMLElement | null>(null);
const isTruncated = ref(false);
let labelObserver: ResizeObserver | null = null;
function updateTruncation(): void {
  const text = labelText.value;
  isTruncated.value =
    text !== null && text.scrollHeight > text.clientHeight + 1;
}
function openLabel(): void {
  if (isTruncated.value) emit("show-label");
}
onMounted(() => {
  if (labelText.value !== null) {
    labelObserver = new ResizeObserver(updateTruncation);
    labelObserver.observe(labelText.value);
  }
  updateTruncation();
});
onBeforeUnmount(() => labelObserver?.disconnect());
watch(
  () => props.label,
  () => void nextTick(updateTruncation),
);
const pointerY = ref<number | null>(null);
const stagedOffset = ref(0);
function commit(offset: -1 | 1): void {
  emit("move", { offset, control: "handle" });
}
function startPointer(event: PointerEvent): void {
  if (event.pointerType === "touch" || props.disabled) return;
  grabbed.value = true;
  pointerY.value = event.clientY;
  stagedOffset.value = 0;
  (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
}
function movePointer(event: PointerEvent): void {
  if (!grabbed.value || pointerY.value === null) return;
  const offset = event.clientY - pointerY.value;
  if (Math.abs(offset) >= 28) {
    stagedOffset.value = offset > 0 ? 1 : -1;
  }
}
function dropPointer(): void {
  if (grabbed.value && stagedOffset.value !== 0)
    commit(stagedOffset.value as -1 | 1);
  cancelDrag();
}
function cancelDrag(): void {
  grabbed.value = false;
  pointerY.value = null;
  stagedOffset.value = 0;
}
</script>
<style scoped lang="scss">
.menu-reorder-row {
  display: flex;
  box-sizing: border-box;
  block-size: calc(var(--expressa-space-48) + var(--expressa-space-8));
  min-block-size: calc(var(--expressa-space-48) + var(--expressa-space-8));
  flex-basis: calc(var(--expressa-space-48) + var(--expressa-space-8));
  align-items: center;
  gap: var(--expressa-space-sm);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  padding: 0 var(--expressa-space-sm);
}
.menu-reorder-row--grabbed {
  background: var(--expressa-color-control-hover-surface);
}
.menu-reorder-row__handle,
.menu-reorder-row .admin-button {
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
  padding: var(--expressa-space-8);
}
.menu-reorder-row__handle {
  cursor: grab;
}
.menu-reorder-row--grabbed .menu-reorder-row__handle {
  cursor: grabbing;
}
.menu-reorder-row .menu-reorder-row__label {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-inline: 0;
  color: var(--expressa-color-text-primary);
  text-align: start;
  font-weight: var(--expressa-font-weight-semibold);
  cursor: default;
}
.menu-reorder-row .menu-reorder-row__label--truncated {
  cursor: pointer;
}
.menu-reorder-row__label-text {
  display: -webkit-box;
  min-width: 0;
  max-block-size: calc(2em * var(--expressa-line-height-tight));
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow-wrap: anywhere;
  line-height: var(--expressa-line-height-tight);
}
@media (pointer: coarse), (max-width: 767px) {
  .menu-reorder-row__handle {
    display: none;
  }
}
</style>
