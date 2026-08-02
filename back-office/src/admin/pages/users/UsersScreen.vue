<template>
  <v-app class="users-screen">
    <main class="users-screen__content">
      <header class="users-screen__header">
        <div class="users-screen__header-copy">
          <h1 class="users-screen__title">Пользователи</h1>
          <p class="users-screen__description">
            Управляйте доступом и ролями сотрудников
          </p>
        </div>
        <AdminButton
          class="users-screen__add-button"
          @click="isAddDialogOpen = true"
        >
          Добавить
        </AdminButton>
      </header>

      <section
        class="users-screen__filters"
        aria-label="Поиск и фильтры пользователей"
      >
        <label class="users-screen__search-label" for="users-search">
          Фильтр по имени или телефону
        </label>
        <AdminTextField
          id="users-search"
          v-model="searchQuery"
          class="users-screen__search"
          placeholder="Фильтр по имени или телефону"
          type="search"
        />
        <FilterTabs v-model="activeFilter" :items="USER_FILTER_ITEMS" />
      </section>

      <section class="users-screen__list" aria-label="Пользователи">
        <EmptyState
          v-if="filteredUsers.length === 0"
          description="Они появятся после добавления"
          title="Пользователей нет"
        />
        <div v-else class="users-screen__rows">
          <UserRow
            v-for="user in filteredUsers"
            :key="user.id"
            :user="user"
            @action="openActionDialog($event, user)"
          />
        </div>
      </section>
    </main>

    <AddUserDialog v-model:open="isAddDialogOpen" @add="addUser" />
    <UserActionDialog
      v-if="actionSelection"
      v-model:open="isActionDialogOpen"
      :action="actionSelection.action"
      :user="actionSelection.user"
      @cancel="closeActionDialog"
      @confirm="confirmAction"
    />
    <v-snackbar v-model="isSnackbarOpen" :timeout="USERS_SNACKBAR_TIMEOUT">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";

import type {
  AddUserData,
  User,
  UserAction,
  UserRole,
} from "../../shared/ui/Admin.types";
import AdminButton from "../../shared/ui/admin-button/AdminButton.vue";
import AdminTextField from "../../shared/ui/admin-text-field/AdminTextField.vue";
import EmptyState from "../../shared/ui/empty-state/EmptyState.vue";
import FilterTabs from "../../shared/ui/filter-tabs/FilterTabs.vue";
import AddUserDialog from "./AddUserDialog.vue";
import UserActionDialog from "./UserActionDialog.vue";
import UserRow from "./UserRow.vue";
import {
  USER_FILTER_ALL,
  USER_FILTER_ITEMS,
  USERS_SNACKBAR_TIMEOUT,
} from "./UsersScreen.constants";
import type {
  ActionSelection,
  UserFilter,
  UsersScreenEmits,
  UsersScreenProps,
} from "./UsersScreen.types";

const props = defineProps<UsersScreenProps>();

const emit = defineEmits<UsersScreenEmits>();

const activeFilter = shallowRef<UserFilter>(USER_FILTER_ALL);
const searchQuery = shallowRef("");
const isAddDialogOpen = shallowRef(false);
const isActionDialogOpen = shallowRef(false);
const actionSelection = shallowRef<ActionSelection | null>(null);
const snackbarMessage = shallowRef("");
const isSnackbarOpen = shallowRef(false);

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase("ru-RU");

  return props.users.filter((user) => {
    const matchesSearch =
      !query ||
      user.name.toLocaleLowerCase("ru-RU").includes(query) ||
      user.phone?.toLocaleLowerCase("ru-RU").includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter.value === "barista") {
      return user.role === "barista";
    }

    if (activeFilter.value === "no_role") {
      return !user.role;
    }

    if (activeFilter.value === "blocked") {
      return user.status === "blocked";
    }

    return true;
  });
});

function showSnackbar(message: string) {
  snackbarMessage.value = message;
  isSnackbarOpen.value = true;
}

function openActionDialog(action: UserAction, user: User) {
  actionSelection.value = { action, user };
  isActionDialogOpen.value = true;
}

function closeActionDialog() {
  isActionDialogOpen.value = false;
  actionSelection.value = null;
}

function addUser(data: AddUserData) {
  emit("add-user", data);
  showSnackbar(`«${data.name}» добавлен`);
}

function confirmAction(role: UserRole | undefined) {
  const selection = actionSelection.value;

  if (!selection) {
    return;
  }

  if (selection.action === "change_role" && role) {
    emit("update-role", { userId: selection.user.id, role });
    showSnackbar(
      `Роль изменена на «${role === "barista" ? "Бариста" : "Администратор"}»`,
    );
  }

  if (selection.action === "block" || selection.action === "unblock") {
    emit("toggle-block", { userId: selection.user.id });
    showSnackbar(
      `«${selection.user.name}» ${selection.action === "block" ? "заблокирован" : "разблокирован"}`,
    );
  }

  closeActionDialog();
}
</script>

<style scoped lang="scss">
.users-screen {
  min-height: 100%;
  color: var(--expressa-color-text-primary);
  background: var(--expressa-color-surface-raised);
}

.users-screen__content {
  width: min(100%, var(--expressa-size-users-content-max-width));
  min-height: 100%;
  margin: 0 auto;
  padding: var(--expressa-space-xl) var(--expressa-space-lg);
}

.users-screen__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--expressa-space-md);
  margin-bottom: var(--expressa-space-lg);
}

.users-screen__title {
  margin: 0;
  font-size: var(--expressa-font-size-screen-title);
  line-height: var(--expressa-line-height-heading);
}

.users-screen__description {
  margin: var(--expressa-space-xs) 0 0;
  color: var(--expressa-color-text-secondary);
  font-size: var(--expressa-font-size-body);
  line-height: var(--expressa-line-height-body);
}

.users-screen__filters {
  margin-bottom: var(--expressa-space-lg);
}

.users-screen__search-label {
  position: absolute;
  width: var(--expressa-size-visually-hidden);
  height: var(--expressa-size-visually-hidden);
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.users-screen__rows {
  overflow: hidden;
  border: var(--expressa-border-width-default) solid
    var(--expressa-color-border);
  border-radius: var(--expressa-radius-lg);
  background: var(--expressa-color-surface);
}

@media (max-width: 599px) {
  .users-screen__content {
    padding: var(--expressa-space-lg) var(--expressa-space-md);
  }

  .users-screen__header {
    align-items: stretch;
    flex-direction: column;
  }

  .users-screen__add-button {
    width: 100%;
  }
}
</style>
