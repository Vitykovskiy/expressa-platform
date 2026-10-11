<template>
  <section
    class="association-finder"
    aria-labelledby="association-finder-heading"
  >
    <h3 id="association-finder-heading">Добавить группу</h3>
    <UiTextField
      id="association-group-search"
      v-model="query"
      type="search"
      name="association-group-search"
      autocomplete="off"
      label="Поиск по названию группы"
      :disabled="disabled"
    />
    <p v-if="groups.length === 0">Нет групп для добавления</p>
    <p v-else-if="candidates.length === 0">Ничего не найдено</p>
    <ul v-else class="association-finder__list">
      <li v-for="(group, index) in candidates" :key="group.id">
        <div class="association-finder__identity">
          <span>{{ group.name }}</span>
          <span
            >{{ group.typeLabel
            }}<template v-if="!group.isActive"> · Неактивна</template></span
          >
        </div>
        <UiButton
          variant="quiet"
          :disabled="disabled"
          :aria-label="`Добавить в категорию: ${group.name}, запись ${index + 1}`"
          @activate="emit('add', group.id)"
          >Добавить</UiButton
        >
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import UiTextField from "../../shared/ui/UiTextField/UiTextField.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import { associationSelectionLabels } from "./CategoryGroupAssignment.constants";
import type {
  AssociationFinderProps,
  AssociationFinderEmits,
} from "./CategoryGroupAssignment.types";

const props = defineProps<AssociationFinderProps>();
const emit = defineEmits<AssociationFinderEmits>();
const query = ref("");
const candidates = computed(() => {
  const search = query.value.trim().toLocaleLowerCase("ru-RU");

  return props.groups
    .filter((group) => group.name.toLocaleLowerCase("ru-RU").includes(search))
    .map((group) => ({
      ...group,
      typeLabel: associationSelectionLabels[group.selectionType],
    }));
});
</script>

<style scoped>
.association-finder,
.association-finder__identity {
  display: grid;
  gap: var(--space-md);
  min-inline-size: 0;
}
.association-finder__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.association-finder__list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-block: var(--space-md);
  border-block-start: var(--border-width) solid var(--color-border);
  overflow-wrap: anywhere;
}
.association-finder__identity {
  flex: 1;
}
</style>
