<template>
  <UiDialog :open="open" :title="title" @update:open="emit('cancel')">
    <template v-if="intent">
      <p>
        {{ intent.baseline.category.name
        }}<template v-if="!intent.baseline.category.isActive">
          · Категория неактивна</template
        >
      </p>
      <ol v-if="groups.length > 0" class="association-confirmation__groups">
        <li v-for="group in groups" :key="group.id">
          {{ group.name }} · {{ group.typeLabel
          }}<template v-if="!group.isActive"> · Неактивна</template>
        </li>
      </ol>
      <p>{{ associationReplacementMessage }}</p>
    </template>
    <template #actions>
      <UiButton variant="secondary" @activate="emit('cancel')"
        >Отменить</UiButton
      >
      <UiButton :disabled="disabled" @activate="emit('confirm')"
        >Заменить группы</UiButton
      >
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiDialog from "../../shared/ui/UiDialog/UiDialog.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import {
  associationReplacementMessage,
  associationSelectionLabels,
} from "./CategoryGroupAssignment.constants";
import type {
  AssociationConfirmationProps,
  AssociationConfirmationEmits,
} from "./CategoryGroupAssignment.types";

const props = defineProps<AssociationConfirmationProps>();
const emit = defineEmits<AssociationConfirmationEmits>();
const title = computed(() =>
  props.intent?.ids.length === 0
    ? "Убрать все связи категории?"
    : "Заменить группы категории?",
);
const groups = computed(
  () =>
    props.intent?.ids.flatMap((id) => {
      const group = props.intent?.baseline.groups.find(
        (item) => item.id === id,
      );

      return group === undefined
        ? []
        : [
            {
              ...group,
              typeLabel: associationSelectionLabels[group.selectionType],
            },
          ];
    }) ?? [],
);
</script>

<style scoped>
.association-confirmation__groups {
  padding-inline-start: var(--space-xl);
  overflow-wrap: anywhere;
}
</style>
