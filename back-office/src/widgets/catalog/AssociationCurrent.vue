<template>
  <section
    class="association-current"
    aria-labelledby="association-current-heading"
  >
    <h3 id="association-current-heading">Текущие видимые связи</h3>
    <p v-if="!category">Категория недоступна</p>
    <template v-else>
      <p>
        {{ category.name
        }}<template v-if="!category.isActive"> · Категория неактивна</template>
      </p>
      <p v-if="groups.length === 0">Видимых связей нет</p>
      <ol v-else>
        <li v-for="group in groups" :key="group.id">
          {{ group.name }} · {{ group.typeLabel
          }}<template v-if="!group.isActive"> · Неактивна</template>
        </li>
      </ol>
    </template>
    <p>
      Текущий список не подтверждает исход исходного изменения. Возврат завершит
      только локальную задачу.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { visibleCategoryLinks } from "../../entities/catalog/category-association.mapper";
import { associationSelectionLabels } from "../../features/category-group-assignment/CategoryGroupAssignment.constants";
import type { AssociationCurrentProps } from "./AssociationCurrent.types";

const props = defineProps<AssociationCurrentProps>();
const category = computed(() =>
  props.data.categories.find((item) => item.id === props.categoryId),
);
const groups = computed(() =>
  (visibleCategoryLinks(props.data, props.categoryId) ?? []).flatMap((link) => {
    const group = props.data.modifierGroups.find(
      (item) => item.id === link.groupId,
    );

    return group === undefined
      ? []
      : [
          {
            ...group,
            typeLabel: associationSelectionLabels[group.selectionType],
          },
        ];
  }),
);
</script>

<style scoped>
.association-current {
  display: grid;
  gap: var(--space-md);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.association-current ol {
  padding-inline-start: var(--space-xl);
}
</style>
