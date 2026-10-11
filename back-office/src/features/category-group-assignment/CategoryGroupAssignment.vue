<template>
  <form
    class="category-group-assignment"
    :aria-busy="attempting"
    @submit.prevent="emit('save')"
  >
    <div>
      <h2
        id="association-task-heading"
        class="foundation-section-title"
        tabindex="-1"
        :aria-describedby="categoryErrorId"
      >
        Группы добавок категории: {{ task.baseline.category.name }}
      </h2>
      <p v-if="!task.baseline.category.isActive">Категория неактивна</p>
      <p v-if="errors.category" id="association-category-error" role="alert">
        {{ errors.category }}
      </p>
    </div>
    <p v-if="errors.form" role="alert">{{ errors.form }}</p>
    <AssociationSelection
      :groups="selected"
      :error="errors.membership"
      :disabled="selectionDisabled"
      @remove="remove"
      @move="move"
    />
    <AssociationFinder
      :groups="candidates"
      :disabled="selectionDisabled"
      @add="add"
    />
    <div class="category-group-assignment__actions">
      <UiButton
        id="association-save"
        type="submit"
        :disabled="selectionDisabled"
        >Сохранить группы</UiButton
      >
      <UiButton
        variant="secondary"
        :disabled="disabled || confirming"
        @activate="emit('cancel')"
        >Отменить изменения</UiButton
      >
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import AssociationFinder from "./AssociationFinder.vue";
import AssociationSelection from "./AssociationSelection.vue";
import { associationSelectionLabels } from "./CategoryGroupAssignment.constants";
import type {
  CategoryGroupAssignmentProps,
  CategoryGroupAssignmentEmits,
} from "./CategoryGroupAssignment.types";

const props = defineProps<CategoryGroupAssignmentProps>();
const emit = defineEmits<CategoryGroupAssignmentEmits>();
const selectionDisabled = computed(
  () => props.disabled || props.confirming || props.readOnly,
);
const categoryErrorId = computed(() =>
  props.errors.category ? "association-category-error" : undefined,
);
const selected = computed(() =>
  props.task.ids.flatMap((id, index) => {
    const group = props.task.baseline.groups.find((item) => item.id === id);

    return group === undefined
      ? []
      : [
          {
            ...group,
            typeLabel: associationSelectionLabels[group.selectionType],
            canMoveUp: index > 0,
            canMoveDown: index < props.task.ids.length - 1,
          },
        ];
  }),
);
const candidates = computed(() =>
  props.groups.filter((group) => !props.task.ids.includes(group.id)),
);

async function focusAfterChange(
  id: string,
  origin: Element | null,
  task: CategoryGroupAssignmentProps["task"],
  revision: number,
) {
  await nextTick();
  if (
    !props.active ||
    props.disabled ||
    props.readOnly ||
    props.confirming ||
    props.task !== task ||
    props.task.revision !== revision ||
    (document.activeElement !== origin &&
      document.activeElement !== document.body)
  )
    return;

  document.getElementById(id)?.focus({ preventScroll: true });
}

function add(id: string) {
  if (selectionDisabled.value) return;
  const origin = document.activeElement;
  const task = props.task;
  const revision = task.revision + 1;

  emit("add", id);
  void focusAfterChange(`association-selected-${id}`, origin, task, revision);
}

function remove(id: string) {
  if (selectionDisabled.value) return;
  const origin = document.activeElement;
  const task = props.task;
  const index = task.ids.indexOf(id);
  const next = task.ids[index + 1] ?? task.ids[index - 1];
  const revision = task.revision + 1;

  emit("remove", id);
  void focusAfterChange(
    next ? `association-selected-${next}` : "association-group-search",
    origin,
    task,
    revision,
  );
}

function move(id: string, direction: -1 | 1) {
  if (selectionDisabled.value) return;
  const origin = document.activeElement;
  const task = props.task;
  const revision = task.revision + 1;

  emit("move", id, direction);
  void focusAfterChange(
    `association-${direction === -1 ? "up" : "down"}-${id}`,
    origin,
    task,
    revision,
  );
}

watch(
  () => props.errors,
  async (errors) => {
    if (!errors.membership && !errors.category && !errors.form) return;
    const origin = document.activeElement;
    const task = props.task;
    const target = errors.membership
      ? "association-selected-heading"
      : "association-task-heading";

    await nextTick();
    if (
      !props.active ||
      props.confirming ||
      props.task !== task ||
      origin?.closest(".ui-dialog") ||
      (document.activeElement !== origin &&
        document.activeElement !== document.body)
    )
      return;
    document.getElementById(target)?.focus({ preventScroll: true });
  },
);
</script>

<style scoped>
.category-group-assignment {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.category-group-assignment__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}
</style>
