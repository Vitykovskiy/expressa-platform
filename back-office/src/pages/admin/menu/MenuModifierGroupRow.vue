<template>
  <div class="menu-modifier-row">
    <span
      ><strong>{{ props.group.name }}</strong
      ><small>{{ count }}</small></span
    >
    <button
      type="button"
      :aria-label="`Редактировать группу добавок ${props.group.name}`"
      @click="emit('edit', props.group)"
    >
      Редактировать
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { modifierOptionCountLabel } from "./catalog-formatters";
import type {
  MenuModifierGroupRowEmits,
  MenuModifierGroupRowProps,
} from "./MenuModifierGroupRow.types";
const props = defineProps<MenuModifierGroupRowProps>();
const emit = defineEmits<MenuModifierGroupRowEmits>();
const count = computed(() =>
  modifierOptionCountLabel(props.group.options.length),
);
</script>
<style scoped lang="scss">
.menu-modifier-row {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--expressa-color-border);
}
.menu-modifier-row span:first-child {
  display: grid;
  gap: 2px;
}
.menu-modifier-row small {
  color: var(--expressa-color-text-muted);
}
.menu-modifier-row button {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: var(--expressa-color-accent);
  font: inherit;
}
</style>
