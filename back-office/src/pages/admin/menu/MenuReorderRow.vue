<template>
  <div
    class="menu-reorder-row"
    :class="{ 'menu-reorder-row--grabbed': grabbed }"
  >
    <AdminButton
      class="menu-reorder-row__handle"
      type="button"
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
      @click="emit('toggle')"
    >
      {{ props.expanded ? "Скрыть товары" : "Показать товары" }}</AdminButton
    ><span class="menu-reorder-row__label">{{ props.label }}</span>
    <AdminButton
      type="button"
      :disabled="props.disabled || !props.canMoveUp"
      :data-reorder-control="`${props.id}:up`"
      @click="emit('move', { offset: -1, control: 'up' })"
    >
      <AdminIcon :icon="ChevronUp" />
    </AdminButton>
    <AdminButton
      type="button"
      :disabled="props.disabled || !props.canMoveDown"
      :data-reorder-control="`${props.id}:down`"
      @click="emit('move', { offset: 1, control: 'down' })"
    >
      <AdminIcon :icon="ChevronDown" />
    </AdminButton>
  </div>
</template>
<script setup lang="ts">
import { ChevronDown, ChevronUp, GripVertical } from "lucide-vue-next";
import { ref } from "vue";
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
  block-size: var(--expressa-size-row-min);
  min-block-size: var(--expressa-size-row-min);
  flex-basis: var(--expressa-size-row-min);
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
}
.menu-reorder-row__handle {
  cursor: grab;
}
.menu-reorder-row--grabbed .menu-reorder-row__handle {
  cursor: grabbing;
}
.menu-reorder-row__label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--expressa-font-weight-semibold);
}
.menu-reorder-row__disclosure {
  min-width: var(--expressa-size-control-min-height);
  min-height: var(--expressa-size-control-min-height);
}
@media (pointer: coarse) {
  .menu-reorder-row__handle {
    display: none;
  }
}
</style>
