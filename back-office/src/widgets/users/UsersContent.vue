<template>
  <section class="users-content">
    <header class="users-content__header">
      <h1 class="users-content__title">Пользователи</h1>
      <button class="users-content__add" type="button" @click="emit('create')">
        <img :src="USER_ASSETS.plus" alt="" />Добавить
      </button>
    </header>
    <div class="users-content__search">
      <OperationsInput
        type="search"
        label="Фильтр по имени или телефону"
        hide-label
        placeholder="Фильтр по имени или телефону"
        :model-value="props.query"
        @update:model-value="emit('update:query', $event)"
      />
    </div>
    <OperationsTabs
      class="users-content__filters"
      label="Роль и доступ пользователя"
      :options="USERS_FILTERS"
      :model-value="props.filter"
      @update:model-value="selectFilter"
    />
    <div class="users-content__results" :aria-busy="props.loading">
      <p v-if="props.loading" class="users-content__status" role="status">
        {{ loadingMessage }}
      </p>
      <div v-if="props.error" class="users-content__failure" role="alert">
        <p>{{ props.error }}</p>
        <OperationsButton
          label="Повторить"
          kind="secondary"
          @click="emit('retry')"
        />
      </div>
      <ul v-if="hasUsers" class="users-content__list" aria-label="Пользователи">
        <UserRow
          v-for="user in props.users"
          :key="user.id"
          :user="user"
          @role="emit('role', $event)"
          @access="emit('access', $event)"
        />
      </ul>
      <div v-else-if="showEmpty" class="users-content__empty" role="status">
        <img :src="USER_ASSETS.empty" alt="" />
        <h2 class="users-content__empty-title">{{ emptyTitle }}</h2>
        <p class="users-content__empty-description">{{ emptyDescription }}</p>
      </div>
    </div>
    <button
      class="users-content__floating"
      type="button"
      aria-label="Добавить пользователя"
      @click="emit('create')"
    >
      <img :src="USER_ASSETS.plusMobile" alt="" />
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import OperationsInput from "../../shared/ui/operations/OperationsInput.vue";
import OperationsTabs from "../../shared/ui/operations/OperationsTabs.vue";
import OperationsButton from "../../shared/ui/operations/OperationsButton.vue";
import {
  USER_ASSETS,
  USERS_FILTERS,
} from "../../features/users/presentation/Users.constants";
import UserRow from "./UserRow.vue";
import type {
  UsersContentProps,
  UsersContentEmits,
} from "./UsersContent.types";

const props = defineProps<UsersContentProps>();
const emit = defineEmits<UsersContentEmits>();

const hasUsers = computed(() => props.users.length > 0);
const showEmpty = computed(() => !props.loading && props.error === null);
const loadingMessage = computed(() =>
  hasUsers.value
    ? "Обновляем список. Ниже — ранее полученные данные."
    : "Загрузка пользователей…",
);
const hasSearch = computed(() => props.query.trim().length > 0);
const emptyTitle = computed(() =>
  hasSearch.value ? "Никого не нашли" : "Пользователей нет",
);
const emptyDescription = computed(() =>
  hasSearch.value
    ? "Измените имя или номер в поиске"
    : "Они появятся после добавления",
);

function selectFilter(value: string) {
  const option = USERS_FILTERS.find((filter) => filter.id === value);

  if (option) {
    emit("update:filter", option.id);
  }
}
</script>

<style scoped>
.users-content {
  width: 100%;
  max-width: 720px;
  min-width: 0;
  margin-inline: auto;
  padding: 24px;
  color: var(--color-foreground);
  font-family: Inter, sans-serif;
}
.users-content__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
}
.users-content__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
}
.users-content__add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font:
    500 13px/19.5px Inter,
    sans-serif;
  cursor: pointer;
}
.users-content__search {
  padding-bottom: 12px;
}
.users-content__results {
  padding-top: 16px;
}
.users-content__list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
.users-content__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 48px 24px;
  text-align: center;
}
.users-content__empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}
.users-content__empty-description {
  margin: 0;
  color: var(--color-foreground-muted);
  font-size: 14px;
  line-height: 20px;
}
.users-content__status,
.users-content__failure {
  padding: 24px;
  font-size: 14px;
  line-height: 20px;
}
.users-content__failure {
  color: var(--color-danger);
}
.users-content__floating {
  display: none;
}
@media (max-width: 767px) {
  .users-content {
    min-height: 100%;
    padding: 0 0 96px;
    background: var(--color-background);
  }
  .users-content__header {
    position: sticky;
    z-index: 1;
    top: 0;
    height: 52px;
    align-items: center;
    padding: 0 16px;
    background: var(--color-surface);
  }
  .users-content__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 28px;
  }
  .users-content__add {
    display: none;
  }
  .users-content__search {
    padding: 16px 16px 12px;
  }
  .users-content__filters {
    padding-inline: 16px;
  }
  .users-content__results {
    padding: 16px 16px 0;
  }
  .users-content__floating {
    position: fixed;
    z-index: 3;
    right: 16px;
    bottom: calc(76px + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: 0;
    border-radius: 24px;
    background: var(--color-primary);
    box-shadow:
      0 4px 6px -4px rgb(0 0 0 / 10%),
      0 10px 15px -3px rgb(0 0 0 / 10%);
    cursor: pointer;
  }
}
</style>
