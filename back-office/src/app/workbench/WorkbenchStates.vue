<template>
  <section class="workbench-states" aria-labelledby="states-heading">
    <h2 id="states-heading" class="foundation-section-title">
      Выбор и состояния
    </h2>
    <UiFilterGroup v-model="filter" label="Позиции" :options="filterOptions" />
    <ul class="workbench-states__list">
      <li
        v-for="row in visibleRows"
        :key="row.id"
        class="workbench-states__row"
      >
        <span class="workbench-states__name">{{ row.name }}</span>
        <UiBadge :tone="row.tone">{{ row.label }}</UiBadge>
      </li>
    </ul>
    <div class="workbench-states__feedback">
      <UiFilterGroup
        v-model="feedbackSelection"
        label="Обратная связь"
        :options="feedbackOptions"
      /><UiFeedback :kind="feedbackKind" :text="feedbackText"
        ><template v-if="feedbackKind === 'error'" #action
          ><UiButton @activate="retry">Повторить</UiButton></template
        ></UiFeedback
      >
    </div>
    <UiButton aria-haspopup="dialog" @activate="dialogOpen = true"
      >Открыть подтверждение</UiButton
    >
    <UiDialog
      v-model:open="dialogOpen"
      title="Архивировать позицию?"
      :dismissible="!archivePending"
      ><p class="workbench-states__dialog-text">
        Позиция останется в истории заказов.
      </p>
      <template #actions
        ><UiButton :disabled="archivePending" @activate="dialogOpen = false"
          >Отмена</UiButton
        ><UiButton
          variant="danger"
          :loading="archivePending"
          @activate="archive"
          >Архивировать</UiButton
        ><UiButton v-if="archivePending" @activate="finishArchive"
          >Завершить действие</UiButton
        ></template
      ></UiDialog
    >
  </section>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import UiBadge from "../../shared/ui/UiBadge/UiBadge.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import UiDialog from "../../shared/ui/UiDialog/UiDialog.vue";
import UiFeedback from "../../shared/ui/UiFeedback/UiFeedback.vue";
import UiFilterGroup from "../../shared/ui/UiFilterGroup/UiFilterGroup.vue";
import {
  feedbackOptions,
  filterOptions,
  stateFeedback,
  sampleRows,
} from "./workbench.constants";
import type { FeedbackKind } from "../../shared/ui/UiFeedback/UiFeedback.types";

const filter = shallowRef("all");
const feedbackKind = shallowRef<FeedbackKind>("empty");
const dialogOpen = shallowRef(false);
const archivePending = shallowRef(false);
const visibleRows = computed(() =>
  sampleRows.filter(
    (row) =>
      filter.value === "all" ||
      (filter.value === "available" ? row.available : !row.available),
  ),
);
const feedbackText = computed(() => stateFeedback[feedbackKind.value]);
const feedbackSelection = computed({
  get: () => feedbackKind.value,
  set: selectFeedback,
});

function selectFeedback(value: string) {
  if (
    value === "loading" ||
    value === "empty" ||
    value === "error" ||
    value === "success"
  ) {
    feedbackKind.value = value;
  }
}

function retry() {
  feedbackKind.value = "loading";
}

function archive() {
  archivePending.value = true;
}

function finishArchive() {
  archivePending.value = false;
  dialogOpen.value = false;
}
</script>

<style scoped>
.workbench-states {
  display: grid;
  align-content: start;
  gap: var(--section-gap);
  min-inline-size: 0;
}
.workbench-states__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.workbench-states__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-block: var(--space-lg);
  border-block-end: var(--border-width) solid var(--color-border);
  font-size: var(--font-data);
  line-height: var(--line-data);
}
.workbench-states__name {
  flex: 1 1 12rem;
  overflow-wrap: anywhere;
}
.workbench-states__feedback {
  display: grid;
  gap: var(--space-lg);
}
.workbench-states__dialog-text {
  margin: 0;
}
</style>
