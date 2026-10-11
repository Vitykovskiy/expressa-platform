<template>
  <section class="modifier-reorder">
    <h2
      id="modifier-reorder-heading"
      class="foundation-section-title"
      tabindex="-1"
    >
      Порядок добавок · {{ name }}
    </h2>
    <p v-if="dirty">Порядок не сохранён</p>
    <ol>
      <li
        v-for="(option, index) in options"
        :id="`modifier-order-${option.id}`"
        :key="option.id"
        tabindex="-1"
      >
        <div class="modifier-reorder__identity">
          <span>{{ option.name }}</span
          ><span class="modifier-reorder__metadata"
            >{{ option.isAvailable ? "Доступна" : "Недоступна"
            }}{{ option.isDefault ? " · По умолчанию" : "" }} ·
            {{ option.priceDelta }} ₽</span
          >
        </div>
        <div class="ui-actions">
          <UiButton
            :id="`modifier-order-up-${option.id}`"
            variant="quiet"
            :disabled="disabled || readOnly || index === 0"
            :aria-label="`Выше: ${option.name}, позиция ${index + 1}`"
            @activate="move(option.id, -1)"
            >Выше</UiButton
          >
          <UiButton
            :id="`modifier-order-down-${option.id}`"
            variant="quiet"
            :disabled="disabled || readOnly || index === options.length - 1"
            :aria-label="`Ниже: ${option.name}, позиция ${index + 1}`"
            @activate="move(option.id, 1)"
            >Ниже</UiButton
          >
        </div>
      </li>
    </ol>
    <p v-if="announcement" role="status" aria-atomic="true">
      {{ announcement }}
    </p>
    <div v-if="reconciled" class="modifier-reorder__current">
      <h3>Текущая группа</h3>
      <template v-if="current">
        <p>
          {{ current.name }} ·
          {{
            current.selectionType === "single"
              ? "Один вариант"
              : "Несколько вариантов"
          }}
          · {{ current.minSelect }}–{{ current.maxSelect }} ·
          {{ current.isActive ? "Активна" : "Неактивна" }}
        </p>
        <ol>
          <li v-for="option in current.options" :key="option.id">
            {{ option.name }} · {{ option.priceDelta }} ₽ · Порядок
            {{ option.sortOrder }} ·
            {{ option.isAvailable ? "Доступна" : "Недоступна"
            }}{{ option.isDefault ? " · По умолчанию" : "" }}
          </li>
        </ol>
      </template>
      <p v-else>Группа недоступна</p>
    </div>
    <div v-if="!readOnly || attempting" class="ui-actions">
      <UiButton
        :disabled="disabled || readOnly || !dirty"
        :loading="busy"
        @activate="emit('save')"
        >Сохранить порядок</UiButton
      >
      <UiButton
        variant="secondary"
        :disabled="disabled || readOnly"
        @activate="emit('cancel')"
        >Отменить</UiButton
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ModifierReorderProps,
  ModifierReorderEmits,
} from "./ModifierReorder.types";

const props = defineProps<ModifierReorderProps>();
const emit = defineEmits<ModifierReorderEmits>();
const announcement = ref("");
let mounted = true;

onUnmounted(() => {
  mounted = false;
});
watch(
  () => props.readOnly,
  (value) => {
    if (
      value &&
      props.active &&
      document.activeElement?.closest(".modifier-reorder")
    )
      document
        .getElementById("modifier-reorder-heading")
        ?.focus({ preventScroll: true });
  },
  { flush: "sync" },
);

async function move(id: string, direction: -1 | 1) {
  const origin = document.activeElement;
  const name = props.name;

  emit("move", id, direction);
  await nextTick();
  if (
    !mounted ||
    !props.active ||
    props.disabled ||
    props.readOnly ||
    props.name !== name ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;
  const index = props.options.findIndex((item) => item.id === id);
  const option = props.options[index];

  if (option === undefined) return;
  announcement.value = `${option.name}: позиция ${index + 1} из ${props.options.length}`;
  const button = document.getElementById(
    `modifier-order-${direction === -1 ? "up" : "down"}-${id}`,
  );

  (button?.matches(":disabled")
    ? document.getElementById(`modifier-order-${id}`)
    : button
  )?.focus({ preventScroll: true });
}
</script>

<style scoped>
.modifier-reorder {
  display: grid;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.modifier-reorder ol {
  padding-inline-start: var(--space-xl);
  margin: 0;
}
.modifier-reorder li {
  padding-block: var(--space-lg);
}
.modifier-reorder li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.modifier-reorder__identity {
  display: grid;
  gap: var(--space-sm);
  margin-block-end: var(--space-md);
  font-weight: var(--weight-label);
}
.modifier-reorder__metadata {
  color: var(--color-foreground-muted);
  font-size: var(--font-data);
  font-weight: var(--weight-body);
}
</style>
