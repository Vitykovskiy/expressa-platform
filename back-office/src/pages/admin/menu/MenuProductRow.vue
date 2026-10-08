<template>
  <div class="menu-product-row">
    <AdminButton
      :id="`menu-product-${props.product.id}`"
      class="menu-product-row__edit"
      presentation="row"
      variant="ghost"
      :disabled="props.disabled"
      @click="emit('edit', props.product)"
    >
      <span class="menu-product-row__content">
        <span class="menu-product-row__name">{{ props.product.name }}</span>
        <span class="menu-product-row__prices">
          <span
            v-for="(price, index) in prices"
            :key="index"
            class="menu-product-row__price"
            >{{ price }}</span
          >
        </span>
        <span v-if="!props.product.isActive" class="menu-product-row__state"
          >Скрыт</span
        >
      </span>
      <AdminIcon v-if="!props.showManagementActions" :icon="ChevronRight" />
      <span v-else>Изменить</span>
    </AdminButton>
    <div v-if="props.showManagementActions" class="menu-product-row__order">
      <span>Порядок</span>
      <AdminButton
        :disabled="props.disabled || !props.canMoveUp"
        :data-menu-product-order-action="`${props.product.id}:up`"
        variant="ghost"
        @click="emit('moveUp', props.product)"
        ><AdminIcon :icon="ArrowUp" /><span>Выше</span></AdminButton
      >
      <AdminButton
        :disabled="props.disabled || !props.canMoveDown"
        :data-menu-product-order-action="`${props.product.id}:down`"
        variant="ghost"
        @click="emit('moveDown', props.product)"
        ><AdminIcon :icon="ArrowDown" /><span>Ниже</span></AdminButton
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-vue-next";
import AdminButton from "../../../shared/ui/admin/admin-button/AdminButton.vue";
import AdminIcon from "../../../shared/ui/admin/admin-icon/AdminIcon.vue";
import type {
  MenuProductRowEmits,
  MenuProductRowProps,
} from "./MenuProductRow.types";
const props = defineProps<MenuProductRowProps>();
const emit = defineEmits<MenuProductRowEmits>();
const prices = computed(() => {
  const product = props.product;
  if (product.priceChoices?.length) {
    return [...product.priceChoices]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (choice) =>
          `${choice.portionLabel}: ${choice.price} ₽${choice.isAvailable ? "" : " · Недоступно"}`,
      );
  }
  if (product.price === null) return ["Нет цены"];
  return [
    `${product.portionLabel ? `${product.portionLabel}: ` : ""}${product.price} ₽`,
  ];
});
</script>
<style scoped lang="scss">
.menu-product-row {
  background: var(--expressa-color-surface);
  border-top: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
}
.menu-product-row__edit {
  width: 100%;
}
.menu-product-row__content {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: var(--expressa-space-2xs);
  padding-inline-start: var(--expressa-space-24);
}
.menu-product-row__name {
  font-size: var(--expressa-font-size-body);
  font-weight: var(--expressa-font-weight-semibold);
  overflow-wrap: anywhere;
}
.menu-product-row__prices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-2xs) var(--expressa-space-md);
}
.menu-product-row__price,
.menu-product-row__state {
  overflow-wrap: anywhere;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-caption);
}
.menu-product-row__order {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--expressa-space-sm);
  padding-inline: var(--expressa-space-md);
  color: var(--expressa-color-text-secondary);
}
</style>
