<template>
  <div
    class="modifier-workspace"
    :class="{
      'modifier-workspace--editing': Boolean(formTask),
      'modifier-workspace--current': reconciled,
    }"
  >
    <section class="modifier-workspace__list">
      <div class="modifier-workspace__heading">
        <h2
          id="modifier-list-heading"
          class="foundation-section-title"
          tabindex="-1"
        >
          Группы добавок
        </h2>
        <UiButton
          v-if="!task"
          :disabled="mutationDisabled"
          @activate="emit('create')"
          >Добавить группу</UiButton
        >
      </div>
      <ModifierSearch
        :search="search"
        :disabled="disabled || Boolean(task)"
        :loading="loading"
        :show-refresh="showRefresh"
        @search="emit('search', $event)"
        @refresh="emit('refresh')"
      />
      <div v-if="groups.length === 0" class="modifier-workspace__feedback">
        <p>{{ search.trim() ? "Ничего не найдено" : "Групп пока нет" }}</p>
        <UiButton
          v-if="search.trim() && !task"
          variant="quiet"
          @activate="emit('search', '')"
          >Сбросить поиск</UiButton
        >
      </div>
      <ul v-else class="modifier-workspace__groups">
        <li v-for="group in groups" :key="group.id">
          <button
            :id="`modifier-${group.id}`"
            class="modifier-workspace__row"
            :disabled="mutationDisabled || Boolean(task)"
            :aria-pressed="selectedId === group.id"
            @click="emit('select', group.id)"
          >
            <span class="modifier-workspace__name">{{ group.name }}</span>
            <span
              >{{
                group.selectionType === "single"
                  ? "Один вариант"
                  : "Несколько вариантов"
              }}
              · {{ group.minSelect }}–{{ group.maxSelect }} ·
              {{ group.isActive ? "Активна" : "Неактивна" }}</span
            >
          </button>
          <UiButton
            v-if="!task && optionCount(group.id) > 1"
            variant="quiet"
            :disabled="mutationDisabled"
            :aria-label="`Изменить порядок добавок: ${group.name}`"
            @activate="emit('reorder', group.id)"
            >Порядок добавок</UiButton
          >
        </li>
      </ul>
    </section>
    <section v-if="formTask" class="modifier-workspace__editor">
      <ModifierForm
        :task="formTask"
        :draft="formTask.draft"
        :errors="errors"
        :error-focus="errorFocus"
        :title="title"
        :revision="formTask.revision"
        :active="active"
        :creating="formTask.kind === 'modifier-create'"
        :read-only="readOnly"
        :disabled="disabled"
        :mutation-disabled="mutationDisabled"
        :dirty="dirty"
        :busy="busy"
        :attempting="attempting"
        :can-archive="
          formTask.kind === 'modifier-edit' && !dirty && !mutationDisabled
        "
        :confirming="confirming"
        @draft="emit('draft', $event)"
        @validate="
          (target, context, revision) =>
            emit('validate', target, context, revision)
        "
        @add="emit('add')"
        @remove="emit('remove', $event)"
        @restore="emit('restore', $event)"
        @move="(key, direction) => emit('move', key, direction)"
        @save="emit('save')"
        @cancel="emit('cancel')"
        @archive="emit('archive')"
      />
      <div v-if="reconciled" class="modifier-workspace__feedback">
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
          <ul>
            <li v-for="option in current.options" :key="option.id">
              {{ option.name }} · {{ option.priceDelta }} ₽ · Порядок
              {{ option.sortOrder }} ·
              {{ option.isAvailable ? "Доступна" : "Недоступна"
              }}{{ option.isDefault ? " · По умолчанию" : "" }}
            </li>
          </ul>
        </template>
        <p v-else-if="selectedId">Группа недоступна</p>
        <template v-else>
          <p>Исход создания не подтверждён</p>
          <ul class="modifier-workspace__current-create">
            <li v-for="group in currentGroups" :key="group.id">
              {{ group.name }} ·
              {{
                group.selectionType === "single"
                  ? "Один вариант"
                  : "Несколько вариантов"
              }}
              · {{ group.minSelect }}–{{ group.maxSelect }} ·
              {{ group.isActive ? "Активна" : "Неактивна" }}
              <ul>
                <li v-for="option in group.options" :key="option.id">
                  {{ option.name }} · {{ option.priceDelta }} ₽ · Порядок
                  {{ option.sortOrder }} ·
                  {{ option.isAvailable ? "Доступна" : "Недоступна"
                  }}{{ option.isDefault ? " · По умолчанию" : "" }}
                </li>
              </ul>
            </li>
          </ul>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { modifierAggregate } from "../../entities/catalog/modifier.mapper";
import ModifierForm from "../../features/modifier-group-edit/ModifierForm.vue";
import ModifierSearch from "../../features/modifier-group-search/ModifierSearch.vue";
import UiButton from "../../shared/ui/UiButton/UiButton.vue";
import type {
  ModifierWorkspaceProps,
  ModifierWorkspaceEmits,
} from "./ModifierWorkspace.types";

const props = defineProps<ModifierWorkspaceProps>();
const emit = defineEmits<ModifierWorkspaceEmits>();
const formTask = computed(() =>
  props.task && props.task.kind !== "modifier-reorder" ? props.task : null,
);
const selectedId = computed(() =>
  formTask.value?.kind === "modifier-edit" ? formTask.value.baseline.id : null,
);
const title = computed(() =>
  formTask.value?.kind === "modifier-edit"
    ? formTask.value.baseline.name
    : "Новая группа",
);
const current = computed(() =>
  selectedId.value ? modifierAggregate(props.data, selectedId.value) : null,
);
const currentGroups = computed(() =>
  props.data.modifierGroups.map((group) => ({
    ...group,
    options: props.data.modifierOptions.filter(
      (option) => option.groupId === group.id,
    ),
  })),
);
const groups = computed(() => {
  const query = props.search.trim().toLocaleLowerCase("ru-RU");

  return props.data.modifierGroups.filter((item) =>
    item.name.toLocaleLowerCase("ru-RU").includes(query),
  );
});

function optionCount(id: string) {
  return props.data.modifierOptions.filter((item) => item.groupId === id)
    .length;
}
</script>

<style scoped>
.modifier-workspace,
.modifier-workspace__list,
.modifier-workspace__editor {
  display: grid;
  align-content: start;
  gap: var(--space-xl);
  min-inline-size: 0;
}
.modifier-workspace__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}
.modifier-workspace__groups {
  list-style: none;
  padding: 0;
  margin: 0;
}
.modifier-workspace__groups li + li {
  border-block-start: var(--border-width) solid var(--color-border);
}
.modifier-workspace__row {
  display: grid;
  gap: var(--space-sm);
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding: var(--space-lg);
  text-align: start;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-foreground);
  overflow-wrap: anywhere;
  cursor: pointer;
}
.modifier-workspace__row[aria-pressed="true"] {
  background: var(--color-selected);
  color: var(--color-on-selected);
}
.modifier-workspace__row:disabled {
  cursor: default;
}
.modifier-workspace__row:not(:disabled):hover {
  background: var(--color-surface-muted);
}
.modifier-workspace__row > :last-child {
  font-size: var(--font-data);
}
.modifier-workspace__name {
  font-weight: var(--weight-label);
}
.modifier-workspace__feedback {
  display: grid;
  gap: var(--space-md);
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
.modifier-workspace__feedback ul {
  padding-inline-start: var(--space-xl);
}
@media (max-width: 63.999rem) {
  .modifier-workspace--editing > .modifier-workspace__list {
    display: none;
  }
}
@media (min-width: 64rem) {
  .modifier-workspace--editing {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
  .modifier-workspace__current-create {
    display: none;
  }
}
</style>
