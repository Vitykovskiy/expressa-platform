<template>
  <section
    class="category-modifier-assignments"
    aria-labelledby="category-modifier-assignments-title"
  >
    <h2
      id="category-modifier-assignments-title"
      class="category-modifier-assignments__title"
    >
      Группы добавок категории
    </h2>
    <p
      v-if="props.loading"
      class="category-modifier-assignments__state"
      role="status"
    >
      Загрузка групп добавок…
    </p>
    <p
      v-else-if="props.errorMessage"
      class="category-modifier-assignments__error"
      role="alert"
    >
      {{ props.errorMessage }}
    </p>
    <p
      v-else-if="!hasExistingCategory"
      class="category-modifier-assignments__error"
      role="alert"
    >
      Выберите существующую категорию перед назначением групп.
    </p>
    <form v-else @submit.prevent="save">
      <fieldset
        :disabled="props.disabled"
        class="category-modifier-assignments__list"
      >
        <legend>Назначенные группы</legend>
        <p
          v-if="props.groups.length === 0"
          class="category-modifier-assignments__state"
        >
          Доступных групп добавок нет.
        </p>
        <div
          v-for="group in props.groups"
          :key="group.id"
          class="category-modifier-assignments__row"
        >
          <label class="category-modifier-assignments__name"
            ><input
              :checked="isAssigned(group.id)"
              type="checkbox"
              @change="
                toggleAssignment(
                  group.id,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />{{ group.name }}</label
          >
          <label
            v-if="isAssigned(group.id)"
            class="category-modifier-assignments__order"
            >Порядок<AdminTextField
              :model-value="assignmentOrder(group.id)"
              inputmode="numeric"
              min="0"
              type="number"
              @update:model-value="updateOrder(group.id, $event)"
          /></label>
        </div>
      </fieldset>
      <p
        v-if="validationError"
        class="category-modifier-assignments__error"
        role="alert"
      >
        {{ validationError }}
      </p>
      <div class="category-modifier-assignments__actions">
        <AdminButton :disabled="props.disabled || !isValid" type="submit"
          >Сохранить назначения</AdminButton
        ><AdminButton
          :disabled="props.disabled"
          type="button"
          variant="ghost"
          @click="emit('cancel')"
          >Отмена</AdminButton
        >
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";

import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import type {
  CategoryModifierAssignmentsEmits,
  CategoryModifierAssignmentsProps,
  CategoryModifierAssignmentDraft,
} from "./CategoryModifierAssignments.types";

const props = defineProps<CategoryModifierAssignmentsProps>();
const emit = defineEmits<CategoryModifierAssignmentsEmits>();
const drafts = shallowRef<CategoryModifierAssignmentDraft[]>([]);
const knownGroupIds = computed(
  () => new Set(props.groups.map((group) => group.id)),
);
const hasExistingCategory = computed(() =>
  props.category
    ? props.categories.some((category) => category.id === props.category?.id)
    : false,
);
const validationError = computed(() => {
  if (
    !drafts.value.every((draft) =>
      knownGroupIds.value.has(draft.modifierGroupId),
    )
  )
    return "Назначить можно только существующую группу добавок";
  if (!drafts.value.every((draft) => /^\d+$/.test(draft.sortOrder)))
    return "Укажите неотрицательный порядок для каждой группы";
  return null;
});
const isValid = computed(() => !validationError.value);

function resetDrafts() {
  drafts.value = props.assignments
    .filter((assignment) => assignment.categoryId === props.category?.id)
    .map((assignment) => ({
      modifierGroupId: assignment.modifierGroupId,
      sortOrder: String(assignment.sortOrder),
    }));
}
function isAssigned(groupId: string) {
  return drafts.value.some((draft) => draft.modifierGroupId === groupId);
}
function assignmentOrder(groupId: string) {
  return (
    drafts.value.find((draft) => draft.modifierGroupId === groupId)
      ?.sortOrder ?? "0"
  );
}
function toggleAssignment(groupId: string, assigned: boolean) {
  if (assigned)
    drafts.value = [
      ...drafts.value,
      { modifierGroupId: groupId, sortOrder: String(drafts.value.length) },
    ];
  else
    drafts.value = drafts.value.filter(
      (draft) => draft.modifierGroupId !== groupId,
    );
}
function updateOrder(groupId: string, sortOrder: string) {
  drafts.value = drafts.value.map((draft) =>
    draft.modifierGroupId === groupId ? { ...draft, sortOrder } : draft,
  );
}
function save() {
  if (!hasExistingCategory.value || !props.category || !isValid.value) return;
  emit(
    "save",
    drafts.value.map((draft) => ({
      categoryId: props.category!.id,
      modifierGroupId: draft.modifierGroupId,
      sortOrder: Number(draft.sortOrder),
    })),
  );
}
watch(() => [props.assignments, props.category?.id], resetDrafts, {
  immediate: true,
});
</script>

<style scoped lang="scss">
.category-modifier-assignments,
.category-modifier-assignments__list,
.category-modifier-assignments__row {
  display: grid;
  gap: var(--expressa-space-md);
  min-width: 0;
}
.category-modifier-assignments {
  color: var(--expressa-color-text-primary);
}
.category-modifier-assignments__title {
  margin: 0;
  font-size: var(--expressa-font-size-title);
}
.category-modifier-assignments__list {
  margin: 0;
  padding: var(--expressa-space-md);
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-md);
}
.category-modifier-assignments__row {
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 12rem);
  align-items: end;
}
.category-modifier-assignments__name,
.category-modifier-assignments__order {
  display: grid;
  gap: var(--expressa-space-2xs);
}
.category-modifier-assignments__name {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  overflow-wrap: break-word;
  word-break: normal;
}
.category-modifier-assignments__error {
  margin: var(--expressa-space-sm) 0 0;
  color: var(--expressa-color-status-error);
  font-size: var(--expressa-font-size-caption);
}
.category-modifier-assignments__state {
  margin: 0;
  color: var(--expressa-color-text-muted);
}
.category-modifier-assignments__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--expressa-space-md);
  margin-top: var(--expressa-space-md);
}
@media (max-width: 40rem) {
  .category-modifier-assignments__row {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
}
</style>
