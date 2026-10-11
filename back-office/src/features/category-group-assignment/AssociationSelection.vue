<template>
  <section
    aria-labelledby="association-selected-heading"
    :aria-describedby="errorId"
  >
    <h3
      id="association-selected-heading"
      tabindex="-1"
      :aria-describedby="errorId"
    >
      Группы категории
    </h3>
    <p
      v-if="error"
      id="association-membership-error"
      class="association-selection__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-if="groups.length === 0">В текущем каталоге группы не выбраны</p>
    <ol v-else class="association-selection">
      <li
        v-for="(group, index) in groups"
        :id="`association-selected-${group.id}`"
        :key="group.id"
        tabindex="-1"
      >
        <div class="association-selection__identity">
          <span class="association-selection__name">{{ group.name }}</span>
          <span
            >{{ group.typeLabel
            }}<template v-if="!group.isActive"> · Неактивна</template></span
          >
        </div>
        <div class="association-selection__actions">
          <button
            :id="`association-up-${group.id}`"
            type="button"
            :disabled="disabled"
            :aria-disabled="!group.canMoveUp || disabled"
            :aria-label="`Выше: ${group.name}, запись ${index + 1}`"
            @click="move(group.id, -1, group.canMoveUp)"
          >
            Выше
          </button>
          <button
            :id="`association-down-${group.id}`"
            type="button"
            :disabled="disabled"
            :aria-disabled="!group.canMoveDown || disabled"
            :aria-label="`Ниже: ${group.name}, запись ${index + 1}`"
            @click="move(group.id, 1, group.canMoveDown)"
          >
            Ниже
          </button>
          <button
            type="button"
            :disabled="disabled"
            :aria-label="`Убрать из категории: ${group.name}, запись ${index + 1}`"
            @click="emit('remove', group.id)"
          >
            Убрать из категории
          </button>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  AssociationSelectionProps,
  AssociationSelectionEmits,
} from "./CategoryGroupAssignment.types";

const props = defineProps<AssociationSelectionProps>();
const emit = defineEmits<AssociationSelectionEmits>();
const errorId = computed(() =>
  props.error ? "association-membership-error" : undefined,
);

function move(id: string, direction: -1 | 1, possible: boolean) {
  if (!props.disabled && possible) emit("move", id, direction);
}
</script>

<style scoped>
.association-selection {
  margin: 0;
  padding-inline-start: var(--space-xl);
}
.association-selection li {
  padding-block: var(--space-md);
  overflow-wrap: anywhere;
}
.association-selection__identity {
  display: grid;
  gap: var(--space-sm);
}
.association-selection__name {
  font-weight: var(--weight-label);
}
.association-selection__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-block-start: var(--space-sm);
}
.association-selection__actions button {
  min-block-size: var(--control-height);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-foreground);
  cursor: pointer;
}
.association-selection__actions
  button:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--color-surface-muted);
}
.association-selection__actions
  button:active:not(:disabled):not([aria-disabled="true"]) {
  background: var(--color-selected);
}
.association-selection__actions button[aria-disabled="true"] {
  color: var(--color-foreground-muted);
  cursor: default;
}
.association-selection__actions button:disabled {
  color: var(--color-foreground-muted);
  cursor: default;
}
.association-selection__error {
  color: var(--color-danger);
}
</style>
