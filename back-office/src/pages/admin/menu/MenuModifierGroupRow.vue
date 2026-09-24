<template>
  <div class="menu-modifier-row">
    <AdminButton
      class="menu-modifier-row__toggle"
      type="button"
      variant="ghost"
      :disabled="props.disabled"
      @click="expanded = !expanded"
    >
      <AdminIcon :icon="expanded ? ChevronDown : ChevronRight" />
      <span class="menu-modifier-row__copy"
        ><strong>{{ props.group.name }}</strong
        ><small>{{ count }}</small></span
      >
    </AdminButton>
    <AdminButton
      class="menu-modifier-row__edit"
      type="button"
      variant="ghost"
      :disabled="props.disabled"
      @click="emit('edit', props.group)"
    >
      <AdminIcon :icon="Pencil" />
    </AdminButton>
    <div v-if="expanded" class="menu-modifier-row__options">
      <div
        v-for="option in props.group.options"
        :key="option.id"
        class="menu-modifier-row__option"
      >
        {{ option.name }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { ChevronDown, ChevronRight, Pencil } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import { modifierOptionCountLabel } from "./catalog-formatters";
import type {
  MenuModifierGroupRowEmits,
  MenuModifierGroupRowProps,
} from "./MenuModifierGroupRow.types";
const props = defineProps<MenuModifierGroupRowProps>();
const emit = defineEmits<MenuModifierGroupRowEmits>();
const expanded = shallowRef(false);
const count = computed(() =>
  modifierOptionCountLabel(props.group.options.length),
);
</script>
<style scoped lang="scss">
.menu-modifier-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 68px;
  align-items: center;
  background: var(--expressa-color-surface-raised);
}
.menu-modifier-row + .menu-modifier-row {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-modifier-row__toggle {
  display: flex;
  min-width: 0;
  justify-content: flex-start;
  gap: var(--expressa-space-md);
  padding-inline: var(--expressa-space-md);
  text-align: left;
}
.menu-modifier-row__copy {
  display: grid;
  gap: var(--expressa-space-2xs);
}
.menu-modifier-row small {
  color: var(--expressa-color-text-muted);
}
.menu-modifier-row__edit {
  min-width: var(--expressa-size-control-min-height);
  margin-inline-end: var(--expressa-space-sm);
  color: var(--expressa-color-accent);
}
.menu-modifier-row__options {
  grid-column: 1 / -1;
  background: var(--expressa-color-surface);
}
.menu-modifier-row__option {
  padding: var(--expressa-space-md) var(--expressa-space-48);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
</style>
