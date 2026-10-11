<template>
  <div class="availability-targets">
    <section
      v-for="category in categories"
      :key="category.id"
      class="availability-targets__group"
      :aria-labelledby="`category-${category.id}`"
    >
      <h2 :id="`category-${category.id}`">
        {{ category.label }}
        <span v-if="category.inactive" class="availability-targets__context"
          >Неактивна</span
        >
      </h2>
      <div
        v-for="product in category.products"
        :key="product.id"
        class="availability-targets__product"
      >
        <div class="availability-targets__row">
          <div class="availability-targets__identity">
            <h3 :id="`availability-${product.id}`" tabindex="-1">
              {{ product.label }}
            </h3>
            <span v-if="product.inactive" class="availability-targets__context"
              >Неактивен</span
            >
            <span
              v-if="product.price !== null"
              class="availability-targets__context"
              >{{ formatMoney(product.price) }}</span
            >
          </div>
          <AvailabilityChange
            :id="product.id"
            kind="product"
            :value="product.isAvailable"
            :label="`Доступность товара ${product.label}`"
            :disabled="disabled"
            :operation="targetOperation(product.id)"
            :recovery-disabled="recoveryDisabled"
            @change="emit('change', $event)"
            @reconcile="emit('reconcile')"
          />
        </div>
        <div
          v-for="choice in product.choices"
          :key="choice.id"
          class="availability-targets__row availability-targets__choice"
        >
          <div class="availability-targets__identity">
            <h4 :id="`availability-${choice.id}`" tabindex="-1">
              {{ choice.label }}
            </h4>
            <span
              v-if="choice.price !== null"
              class="availability-targets__context"
              >{{ formatMoney(choice.price) }}</span
            >
            <span
              v-if="!product.isAvailable"
              class="availability-targets__context"
              >Товар выключен</span
            >
          </div>
          <AvailabilityChange
            :id="choice.id"
            kind="price_choice"
            :value="choice.isAvailable"
            :label="`Доступность ${product.label}, ${choice.label}`"
            :disabled="disabled"
            :operation="targetOperation(choice.id)"
            :recovery-disabled="recoveryDisabled"
            @change="emit('change', $event)"
            @reconcile="emit('reconcile')"
          />
        </div>
      </div>
    </section>
    <section
      v-for="group in groups"
      :key="group.id"
      class="availability-targets__group"
      :aria-labelledby="`group-${group.id}`"
    >
      <h2 :id="`group-${group.id}`">
        {{ group.label }}
        <span v-if="group.inactive" class="availability-targets__context"
          >Неактивна</span
        >
      </h2>
      <details
        v-if="group.products.length"
        class="availability-targets__relations"
      >
        <summary>Товары группы</summary>
        <ul>
          <li v-for="product in group.products" :key="product.id">
            {{ product.categoryLabel }}: {{ product.label }}
          </li>
        </ul>
      </details>
      <p
        v-else-if="!group.categoryIds.length"
        class="availability-targets__context"
      >
        Не привязана
      </p>
      <div
        v-for="option in group.options"
        :key="option.id"
        class="availability-targets__row"
      >
        <div class="availability-targets__identity">
          <h3 :id="`availability-${option.id}`" tabindex="-1">
            {{ option.label }}
          </h3>
          <span
            v-if="option.price !== null"
            class="availability-targets__context"
            >{{ formatDelta(option.price) }}</span
          >
        </div>
        <AvailabilityChange
          :id="option.id"
          kind="modifier"
          :value="option.isAvailable"
          :label="`Доступность добавки ${group.label}, ${option.label}`"
          :disabled="disabled"
          :operation="targetOperation(option.id)"
          :recovery-disabled="recoveryDisabled"
          @change="emit('change', $event)"
          @reconcile="emit('reconcile')"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AvailabilityChange from "../../features/availability-change/AvailabilityChange.vue";
import type {
  AvailabilityTargetsEmits,
  AvailabilityTargetsProps,
} from "./AvailabilityTargets.types";

const props = defineProps<AvailabilityTargetsProps>();
const emit = defineEmits<AvailabilityTargetsEmits>();

function targetOperation(id: string) {
  return props.operation?.id === id ? props.operation : null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelta(value: number) {
  return `${value > 0 ? "+" : ""}${formatMoney(value)}`;
}
</script>

<style scoped>
.availability-targets {
  display: grid;
  gap: var(--space-xxl);
}
.availability-targets__group {
  min-inline-size: 0;
}
.availability-targets__group h2 {
  font-size: var(--font-section-title);
  overflow-wrap: anywhere;
  margin-block-end: var(--space-md);
}
.availability-targets__product {
  border-block-end: 1px solid var(--color-border);
}
.availability-targets__row {
  display: flex;
  align-items: start;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-md);
  padding-block: var(--space-lg);
  min-inline-size: 0;
  border-block-end: 1px solid var(--color-border);
}
.availability-targets__product > .availability-targets__row {
  border: 0;
}
.availability-targets__identity {
  display: grid;
  gap: var(--space-xs);
  min-inline-size: 0;
  flex: 1 1 14rem;
  overflow-wrap: anywhere;
}
.availability-targets__identity h3,
.availability-targets__identity h4 {
  font-size: var(--font-body);
  font-weight: var(--weight-heading);
}
.availability-targets__row > :last-child {
  flex: 0 1 24rem;
  min-inline-size: 0;
}
.availability-targets__choice {
  margin-inline-start: var(--space-lg);
}
.availability-targets__context {
  font-size: var(--font-data);
  font-weight: var(--weight-body);
  color: var(--color-foreground-muted);
}
.availability-targets__relations {
  margin-block: var(--space-sm);
  overflow-wrap: anywhere;
}
.availability-targets__relations summary {
  min-block-size: var(--control-height);
  display: list-item;
  padding-block: var(--space-sm);
  cursor: pointer;
}
.availability-targets__relations ul {
  padding-inline-start: var(--space-xl);
}
@media (max-width: 37.499rem) {
  .availability-targets__row {
    display: grid;
  }
  .availability-targets__row > :last-child {
    inline-size: 100%;
  }
}
</style>
