<template>
  <div class="menu-modifier-row">
    <AdminButton
      class="menu-modifier-row__toggle"
      presentation="row"
      variant="ghost"
      :disabled="props.disabled || !options.length"
      @click="expanded = !expanded"
    >
      <AdminIcon :icon="expanded ? ChevronDown : ChevronRight" />
      <span class="menu-modifier-row__copy">
        <span class="menu-modifier-row__name">{{ props.group.name }}</span>
        <span class="menu-modifier-row__meta"
          >{{ count
          }}<template v-if="!props.group.isActive"> · Скрыта</template></span
        >
      </span>
    </AdminButton>
    <AdminButton
      presentation="row"
      variant="ghost"
      :disabled="props.disabled"
      @click="emit('edit', props.group)"
      ><AdminIcon :icon="Pencil"
    /></AdminButton>
    <div v-if="expanded && options.length" class="menu-modifier-row__options">
      <div
        v-for="option in options"
        :key="option.id"
        class="menu-modifier-row__option"
      >
        <span class="menu-modifier-row__name">{{ option.name }}</span>
        <span class="menu-modifier-row__meta"
          >{{
            option.priceDelta === 0
              ? "Без доплаты"
              : `${option.priceDelta > 0 ? "+" : ""}${option.priceDelta} ₽`
          }}<template v-if="option.isDefault"> · По умолчанию</template
          ><template v-if="!option.isAvailable"> · Недоступно</template></span
        >
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
const options = computed(() =>
  [...props.group.options].sort((a, b) => a.sortOrder - b.sortOrder),
);
</script>
<style scoped lang="scss">
.menu-modifier-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  background: var(--expressa-color-surface);
}
.menu-modifier-row + .menu-modifier-row {
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-modifier-row__toggle {
  width: 100%;
}
.menu-modifier-row__copy {
  display: grid;
  min-width: 0;
  gap: var(--expressa-space-2xs);
}
.menu-modifier-row__name {
  overflow-wrap: anywhere;
  font-weight: var(--expressa-font-weight-semibold);
}
.menu-modifier-row__meta {
  overflow-wrap: anywhere;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
}
.menu-modifier-row__options {
  grid-column: 1 / -1;
  background: var(--expressa-color-surface);
}
.menu-modifier-row__option {
  display: grid;
  gap: var(--expressa-space-2xs);
  padding: var(--expressa-space-sm) var(--expressa-space-md);
  padding-inline-start: calc(
    var(--expressa-space-md) + var(--expressa-space-24)
  );
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
</style>
