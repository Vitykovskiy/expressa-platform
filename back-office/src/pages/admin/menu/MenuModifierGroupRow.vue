<template>
  <div class="menu-modifier-row">
    <span
      ><strong>{{ props.group.name }}</strong
      ><small>{{ count }}</small></span
    >
    <AdminButton
      type="button"
      variant="ghost"
      :aria-label="`Редактировать группу добавок ${props.group.name}`"
      @click="emit('edit', props.group)"
    >
      Редактировать
    </AdminButton>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
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
  min-height: var(--expressa-size-row-min);
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--expressa-space-md);
  border-bottom: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-modifier-row span:first-child {
  display: grid;
  gap: var(--expressa-space-2xs);
}
.menu-modifier-row small {
  color: var(--expressa-color-text-muted);
}
</style>
