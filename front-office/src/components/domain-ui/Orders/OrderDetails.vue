<template>
  <section class="details">
    <h2>Состав заказа</h2>
    <ul>
      <li v-for="item in items" :key="item.id">
        <span
          ><strong>{{ item.name }} × {{ item.quantity }}</strong
          ><small v-if="item.details">{{ item.details }}</small></span
        ><PriceLabel :amount="item.price * item.quantity" />
      </li>
    </ul>
    <footer><strong>Итого</strong><PriceLabel :amount="total" /></footer>
  </section>
</template>
<script setup lang="ts">
import PriceLabel from "../Menu/PriceLabel.vue";
defineOptions({ name: "FoOrderDetails" });
defineProps<{
  items: readonly {
    id: string;
    name: string;
    details?: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}>();
</script>
<style scoped>
.details {
  display: grid;
  gap: var(--fo-space-3);
  font: 400 1rem/1.3 var(--fo-font);
}
.details h2,
.details ul {
  margin: 0;
}
.details h2 {
  font-size: 1.125rem;
}
.details ul {
  display: grid;
  gap: var(--fo-space-2);
  padding: 0;
  list-style: none;
}
.details li,
.details footer {
  display: flex;
  justify-content: space-between;
  gap: var(--fo-space-3);
}
.details li > span {
  display: grid;
  min-width: 0;
  gap: var(--fo-space-1);
  overflow-wrap: anywhere;
}
.details small {
  color: var(--fo-muted);
}
.details footer {
  padding-top: var(--fo-space-3);
  border-top: 1px solid var(--fo-border);
}
</style>
